const isAdLoggedIn = async(req,res,next)=>{
    try{ 
        if (req.session && req.session.adminData) {
        next();
      } else {
        res.redirect("/admin/adminLogin");
      }
    }catch(error){
        console.log(error.message)
    }
}

  
  const isAdLoggedOut = async(req,res,next)=>{
      try{
          if (req.session && req.session.adminData ) {
            res.redirect('/admin/adminDashboard')
            } else {
            next()
            }
  
      }catch(error){
          console.log(error.message)
      }
  }

  
  
  module.exports = {
    isAdLoggedIn,
      isAdLoggedOut
  }