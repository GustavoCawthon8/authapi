require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=> console.log("mongoDb funcionando"))
   .catch((err)=> console.log(err));

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
})

const User = mongoose.model('User', UserSchema);

app.post("/register", async(req, res)=>{
  try{
    const {username, email, password} = req.body;

    const userExists = await User.findOne({email});
    if(userExists){
      return res.status(400).json({mensagem: 'Usuário já existe'});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({mensagem: 'Usuário criado com sucesso'})
  }catch(err){
    res.status(500).json({mensagem: 'Error no servidor'})

  }
})

app.post('/login', async(req, res)=>{
  try{
    const {email, password} = req.body;
    const user = await User.findOne({email});
    const isMatch = await bcrypt.compare(password, user.password);
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'});

    if(!user){
      return res.status(400).json({mensagem: 'Usuário não encontrado'});
    }

    if(!isMatch){
      return res.status(400).json({mensagem: 'Senha invalida'});
    }
 
    res.json({mensagem: 'Login realizado com sucesso', token})
  }catch(err){
    res.status(500).json({mensagem: 'erro no servidor'})
  }
})

app.listen(PORT, ()=>{
  console.log(`Servidor rodando na porta http://localhost:${PORT}`)
})