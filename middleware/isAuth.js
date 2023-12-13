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

// const loggedout = (req,res,next)=>{
//     if(req.session.user){
//         next()
//     }else{
//         res.redirect('/')
//     }
// }

const checkSessionVariable = (variableName,redirectPath)=>{
    return (req,res,next)=>{
        if(req.session[variableName]){
        next()
    }else{
        res.redirect(redirectPath)
    }
}
}



module.exports={iflogged, islogged, checkSessionVariable }