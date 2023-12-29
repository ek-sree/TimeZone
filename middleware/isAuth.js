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


const adminlogout = (req,res,next) =>{
    if(req.session.admin){
        next()
    }else{
        res.redirect('/admin')
    }
}

const logoutAdmin = (req, res, next) => {
    if(!req.session.admin){
        res.redirect("/admin")
        next()
    } else {
        res.redirect('/admin/adminpanel')
    }
}




module.exports={iflogged, islogged, checkSessionVariable, adminlogout ,logoutAdmin}