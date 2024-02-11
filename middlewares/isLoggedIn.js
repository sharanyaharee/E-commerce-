const loggedIn = async (req, res, next) => {
  try {
    if (req.session && req.session.userData && req.session.userData._id) {
      next();
    } else {
      res.redirect("/userLogin");
    }
  } catch (error) {
    console.log(error.message)
  }
};



const loggedOut = async(req,res,next)=>{
    try{
        if (req.session && req.session.userData && req.session.userData._id) {
            
            req.session.userData._id = null;
            
            res.redirect("/");
          } else {
          next()
          }

    }catch(error){
        console.log(error.message)
    }
}

module.exports = {
    loggedIn,
    loggedOut
}