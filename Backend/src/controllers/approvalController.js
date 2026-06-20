const ApprovalService = require('../services/ApprovalService');

const approveSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const submission = await ApprovalService.approveSubmission(id, req.user.id, remarks);
    res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
};

const rejectSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const submission = await ApprovalService.rejectSubmission(id, req.user.id, remarks);
    res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
};

const getApprovalHistory = async (req, res, next) => {
  try {
    const history = await ApprovalService.getApprovalHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

module.exports = { approveSubmission, rejectSubmission, getApprovalHistory };
