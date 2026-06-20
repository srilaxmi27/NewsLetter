const pool = require('../config/db');
const PDFKit = require('pdfkit');
const fs = require('fs');
const path = require('path');
const NotificationService = require('./NotificationService');

// ─────────────────────────────────────────────
// NewsletterService
// ─────────────────────────────────────────────

// Section mapping: submission_type → PDF section name
const SECTION_MAP = {
  STUDENT_ACHIEVEMENT: 'Student Achievements',
  CERTIFICATION:       'Student Achievements',
  SPORTS:              'Student Achievements',
  FACULTY_ACHIEVEMENT: 'Faculty Achievements',
  PLACEMENT:           'Placements',
  RESEARCH:            'Research Publications',
  GUEST_LECTURE:       'Guest Lectures',
  WORKSHOP:            'Department Activities',
};

const createNewsletter = async (departmentId, month, year) => {
  const result = await pool.query(
    `INSERT INTO Newsletters (department_id, month, year, status)
     VALUES ($1, $2, $3, 'Draft')
     RETURNING *`,
    [departmentId, month, year]
  );
  return result.rows[0];
};

const getNewsletterById = async (newsletterId) => {
  const result = await pool.query(
    `SELECT n.*, d.name AS department_name
     FROM Newsletters n
     JOIN Departments d ON d.id = n.department_id
     WHERE n.id = $1`,
    [newsletterId]
  );
  return result.rows[0] || null;
};

const getDepartmentNewsletters = async (departmentId) => {
  const result = await pool.query(
    `SELECT n.*, d.name AS department_name,
       (SELECT COUNT(*) FROM Newsletter_Items ni WHERE ni.newsletter_id = n.id) AS item_count
     FROM Newsletters n
     JOIN Departments d ON d.id = n.department_id
     WHERE n.department_id = $1
     ORDER BY n.year DESC, n.month DESC`,
    [departmentId]
  );
  return result.rows;
};

const addItemToNewsletter = async (newsletterId, submissionId, section, position) => {
  const result = await pool.query(
    `INSERT INTO Newsletter_Items (newsletter_id, submission_id, section, position)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [newsletterId, submissionId, section, position]
  );

  // Mark submission as Selected
  await pool.query(
    `UPDATE Submissions SET status = 'Selected', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [submissionId]
  );

  return result.rows[0];
};

const removeItemFromNewsletter = async (newsletterId, submissionId) => {
  await pool.query(
    `DELETE FROM Newsletter_Items
     WHERE newsletter_id = $1 AND submission_id = $2`,
    [newsletterId, submissionId]
  );

  // Revert submission back to Approved
  await pool.query(
    `UPDATE Submissions SET status = 'Approved', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [submissionId]
  );
};

const getNewsletterItems = async (newsletterId) => {
  const result = await pool.query(
    `SELECT ni.*, s.title, s.description, s.type, s.metadata,
       u.name AS submitted_by,
       json_agg(sf) FILTER (WHERE sf.id IS NOT NULL) AS files
     FROM Newsletter_Items ni
     JOIN Submissions s ON s.id = ni.submission_id
     JOIN Users u ON u.id = s.user_id
     LEFT JOIN Submission_Files sf ON sf.submission_id = s.id
     WHERE ni.newsletter_id = $1
     GROUP BY ni.id, s.title, s.description, s.type, s.metadata, u.name
     ORDER BY ni.position`,
    [newsletterId]
  );
  return result.rows;
};

const generatePDF = async (newsletterId) => {
  const newsletter = await getNewsletterById(newsletterId);
  if (!newsletter) throw new Error('Newsletter not found');

  const items = await getNewsletterItems(newsletterId);

  const filename = `newsletter_${newsletter.department_name}_${newsletter.month}_${newsletter.year}_${Date.now()}.pdf`;
  const filePath = path.join(__dirname, '../../uploads', filename);
  const fileUrl = `/uploads/${filename}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFKit({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ── HEADER ──
    doc.fontSize(22).font('Helvetica-Bold')
       .text(`${newsletter.department_name} Department`, { align: 'center' });
    doc.fontSize(18).font('Helvetica-Bold')
       .text('NEWSFLOW Newsletter', { align: 'center' });
    doc.fontSize(14).font('Helvetica')
       .text(`${newsletter.month} ${newsletter.year}`, { align: 'center' });
    doc.moveDown(2);

    // ── GROUP BY SECTION ──
    const grouped = {};
    for (const item of items) {
      const section = item.section || SECTION_MAP[item.type] || 'General';
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(item);
    }

    const SECTION_ORDER = [
      'Student Achievements',
      'Faculty Achievements',
      'Placements',
      'Research Publications',
      'Guest Lectures',
      'Department Activities',
    ];

    const allSections = [...new Set([...SECTION_ORDER, ...Object.keys(grouped)])];

    for (const section of allSections) {
      if (!grouped[section] || grouped[section].length === 0) continue;

      // Section header
      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold')
         .fillColor('#1a1a2e')
         .text(section, { underline: true });
      doc.moveDown(1);

      for (const item of grouped[section]) {
        doc.fontSize(13).font('Helvetica-Bold')
           .fillColor('#000000')
           .text(item.title);
        doc.fontSize(10).font('Helvetica')
           .fillColor('#333333')
           .text(item.description || '');

        if (item.metadata && Object.keys(item.metadata).length > 0) {
          doc.moveDown(0.3);
          for (const [key, val] of Object.entries(item.metadata)) {
            doc.fontSize(9).font('Helvetica')
               .fillColor('#555555')
               .text(`${key}: ${val}`);
          }
        }

        doc.fontSize(9).font('Helvetica-Oblique')
           .fillColor('#888888')
           .text(`Submitted by: ${item.submitted_by}`);
        doc.moveDown(1);
      }
    }

    // ── FOOTER ──
    doc.fontSize(9).font('Helvetica')
       .fillColor('#aaaaaa')
       .text(`NEWSFLOW — ${newsletter.department_name} | ${newsletter.month} ${newsletter.year}`, {
         align: 'center',
       });

    doc.end();

    stream.on('finish', async () => {
      // Save to Newsletter_Files
      await pool.query(
        `INSERT INTO Newsletter_Files (newsletter_id, file_url, file_type)
         VALUES ($1, $2, 'PDF')`,
        [newsletterId, fileUrl]
      );
      resolve(fileUrl);
    });

    stream.on('error', reject);
  });
};

const publishNewsletter = async (newsletterId, adminId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE Newsletters
       SET status = 'Published', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'Draft'
       RETURNING *`,
      [newsletterId]
    );

    if (result.rows.length === 0) {
      const err = new Error('Newsletter not found or already published.');
      err.status = 404;
      throw err;
    }

    const newsletter = result.rows[0];

    // Cascade submission statuses to Published
    await client.query(
      `UPDATE Submissions s
       SET status = 'Published', updated_at = CURRENT_TIMESTAMP
       FROM Newsletter_Items ni
       WHERE ni.newsletter_id = $1 AND ni.submission_id = s.id`,
      [newsletterId]
    );

    // Notify all users in the department
    const users = await client.query(
      `SELECT id FROM Users WHERE department_id = $1`,
      [newsletter.department_id]
    );

    for (const user of users.rows) {
      await NotificationService.createNotification(
        user.id,
        'PUBLICATION',
        `The ${newsletter.month} ${newsletter.year} Newsletter has been published!`
      );
    }

    await client.query('COMMIT');
    return newsletter;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const archiveNewsletter = async (newsletterId) => {
  const result = await pool.query(
    `UPDATE Newsletters
     SET status = 'Archived', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'Published'
     RETURNING *`,
    [newsletterId]
  );

  if (result.rows.length === 0) {
    const err = new Error('Newsletter not found or not in Published status.');
    err.status = 404;
    throw err;
  }

  // Cascade to Archived
  await pool.query(
    `UPDATE Submissions s
     SET status = 'Archived', updated_at = CURRENT_TIMESTAMP
     FROM Newsletter_Items ni
     WHERE ni.newsletter_id = $1 AND ni.submission_id = s.id`,
    [newsletterId]
  );

  return result.rows[0];
};

const getArchivedNewsletters = async (departmentId) => {
  const result = await pool.query(
    `SELECT n.*, d.name AS department_name,
       (SELECT json_agg(nf) FROM Newsletter_Files nf WHERE nf.newsletter_id = n.id) AS files
     FROM Newsletters n
     JOIN Departments d ON d.id = n.department_id
     WHERE n.department_id = $1 AND n.status IN ('Published', 'Archived')
     ORDER BY n.year DESC, n.month DESC`,
    [departmentId]
  );
  return result.rows;
};

module.exports = {
  createNewsletter,
  getNewsletterById,
  getDepartmentNewsletters,
  addItemToNewsletter,
  removeItemFromNewsletter,
  getNewsletterItems,
  generatePDF,
  publishNewsletter,
  archiveNewsletter,
  getArchivedNewsletters,
  SECTION_MAP,
};
