var express = require('express')
var app = express()

app.use(express.static(__dirname+"/app"))

app.get('/', function (req, res) {
    res.redirect("app.html")
})
app.get('/testnet', function (req, res) {
    res.redirect("app_public.html")
})

app.listen(3000, function()  {
    console.log("express server running at port 3000")
})