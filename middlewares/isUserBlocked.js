const User = require("../models/userModel");

const userBlocked = async (req, res, next) => {
  try {
    if (req.session && req.session.userData && req.session.userData._id) {
      const id = req.session.userData._id;
      const userdata = await User.findById(id);
    
      if (userdata && userdata.blocked) {
        req.session.userData = null;
      } 
        next();
    
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  userBlocked,
};
