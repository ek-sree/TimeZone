const iflogged = async(req,res,next)=>{
    if(req.session.isAuth){
        res.redirect('/')
    }else{
        next()
    }
}

const islogged= (req,res,next)=>{
    if(req.session.isAuth){
        req.user = req.session.user
        next()
    }else{
        res.redirect('/profile')
    }
}



const checkSessionVariable = (variableName,redirectPath)=>{
    return (req,res,next)=>{
        if(req.session[variableName]){
        next()
    }else{
        res.redirect(redirectPath)
    }
}
}


const loggedadmin = (req, res,next)=>{
    if (req.session.admin) {
        next()
    }else{
        res.redirect('/admin')
    }
}


const logoutAdmin = (req,res,next) =>{
    if(!req.session.admin){
        next()
    }else{
        res.redirect('/admin/adminpanel')
    }
}

const logouting = (req, res, next) => {
   req.session.admin= false;
   req.session.destroy();
   res.redirect('/admin')
}




module.exports={iflogged, islogged, checkSessionVariable, logouting ,logoutAdmin, loggedadmin}