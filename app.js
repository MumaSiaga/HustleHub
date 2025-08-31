const express=require('express');
const path =require('path');
const app=express();

const service = require('./backend/routes/serviceRoutes');
const employerhome = require('./backend/routes/employerRoutes');


const port=process.env.PORT||3000;
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));
app.use('/styles', express.static(path.join(__dirname, 'public','styles')));
app.use('/scripts', express.static(path.join(__dirname, 'public','scripts')));


app.use('/employer',employerhome);
app.use('/service',service);
app.get('/',(req,res)=>{
    res.render('landing');
});

app.listen(port,()=>{
    console.log(`Server is running on ${port}`);
});
