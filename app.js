const express=require('express');
const path =require('path');
const app=express();
const port=process.env.PORT||3000;
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));




app.get('/',(req,res)=>{
    res.render('landing');
});

app.listen(port,()=>{
    console.log(`Server is running on ${port}`);
});
