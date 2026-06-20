const express = require('express');
const router = express.Router();
const { mockAuth, requireRole } = require('../middlewares/auth');
const {
  approveSubmission,
  rejectSubmission,
  getApprovalHistory,
} = require('../controllers/approvalController');

router.use(mockAuth);
router.use(requireRole('Admin'));

router.patch('/:id/approve', approveSubmission);
router.patch('/:id/reject', rejectSubmission);
router.get('/:id/history', getApprovalHistory);

module.exports = router;
