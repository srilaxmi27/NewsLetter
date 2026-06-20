const AuthService = require('../services/AuthService');

const getDemoUsers = async (req, res, next) => {
  try {
    const users = await AuthService.getAllDemoUsers();
    // Group by department for the login page UI
    const grouped = users.reduce((acc, user) => {
      const dept = user.department || 'Unknown';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(user);
      return acc;
    }, {});
    res.json({ success: true, data: grouped });
  } catch (err) {
    next(err);
  }
};

const selectUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await AuthService.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDemoUsers, selectUser };
