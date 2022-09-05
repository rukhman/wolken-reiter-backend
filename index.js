const express = require('express');
const PORT = process.env.PORT || 8000;
const app = express();
const cors = require('cors')
const router = require("./routes/authRouter")

var whitelist = ['http://localhost:4200','http://localhost:8000', 'https://wolken-reiter.netlify.app']
var corsOptions = {
  origin: function (origin, callback) {
    // if (whitelist.indexOf(origin) !== -1) {
    if (true) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}  

app.use(express.json());
app.use(cors(corsOptions))
app.use("/", router)

function start() {
  try {
    app.listen(PORT, () => {
      console.log(`Server has been started on port ${PORT}.`)
    })
  }catch(err) {
    console.error(err)
  }
}

start()