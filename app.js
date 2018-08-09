var express = require('express');
var mysql = require('mysql')
var app = express();
var bodyparser = require('body-parser');
var cors = require('cors');

app.use(cors());
app.use(bodyparser.json())

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'project'
});
db.connect();

// ini product body -------------------------------------------------------------------------------------------

app.get('/body', (req, res) => {
    var data = { status: "active"}
    var sqlget = 'SELECT * FROM product where ?';
    db.query(sqlget,data, (err, result) => {
        if (err) throw err;
        // console.log(result);
        res.send(result);
    });
});

// ini product -------------------------------------------------------------------------------------------

app.get('/Product/:id', (req, res) => {
    var id = req.params.id
    var sqlget = 'SELECT * FROM product WHERE idprod = ?';
    db.query(sqlget, id, (err, result) => {
        if (err) throw err;
        // console.log(result);
        res.send(result);
    });
});

// ini login user / admin -------------------------------------------------------------------------------------------

app.post("/userLogin", (req, res) => {
    db.query("SELECT iduser, name, password FROM user WHERE ? AND ?", [{ name: req.body.name },
    { password: req.body.password, }],
        (err, result) => {
            // console.log(result)
            if (err) throw err;

            let loginstatus
            let iduser
            let name

            if (result.length > 0) {
                loginstatus = true;
                name = req.body.username;
                iduser = result[0].iduser;
            }
            else {
                loginstatus = false;
                name = null;
                iduser = null;
            }

            res.send({ loginstatus, name, iduser });

        })
})
// AddCart --------------------------------------------------------------------------------------------


app.post('/addCart', (req, res) => {
    // console.log(req.body);
    var data = {
        namaprod: req.body.namaprod,
        qtycart: req.body.jumlah,
        harga: req.body.harga,
        userid: req.body.userid,
        status: "active",
        idproductcart: req.body.idprod

    }
    var addpost = 'insert into cart set ?'
    db.query(addpost, data, (err, result) => {
        if (err) throw err;
        // console.log(result);
        var anjay = 'sukses'
        res.send(anjay)
    })

})

// ini Cart -----------------------------------------------------------------------------------------

app.get('/Cart/:id', (req, res) => {
    var data = [{
        userid: req.params.id
    },
    {
        status: "active"
    }]
    var cart = 'SELECT * FROM cart WHERE ? AND ?'
    db.query(cart, data, (err, result) => {
        if (err) throw err;
        // console.log(result);
        res.send(result);
    })

})

// update cart Plus ----------------------------------------------------------------------------------

app.post('/addCartPlus', (req, res) => {
    var data = [
        {
            qtycart: req.body.qty
        },
        {
            idcart: req.body.idcart
        }
    ]
    // console.log(data) 
    var updatePlus = `update cart set ? where ?`
    db.query(updatePlus, data, (err, result) => {
        if (err) throw err;

        res.send(result);
    })
})




// update cart Minus --------------------------------------------------------------------------------

app.post('/addCartMinus', (req, res) => {
    var data = [
        {
            qtycart: req.body.qty
        },
        {
            idcart: req.body.idcart
        }
    ]
    // console.log(data) 
    var updateMinus = `update cart set ? where ?`
    db.query(updateMinus, data, (err, result) => {
        if (err) throw err;

        res.send(result);
    })
})

// update cart Delete --------------------------------------------------------------------------------

app.post('/addCartDelete', (req, res) => {
    var data = [
        {
            status: 'inactive'
        },
        {
            idcart: req.body.idcart
        }
    ]
    // console.log(data) 
    var updateMinus = `update cart set ? where ?`
    db.query(updateMinus, data, (err, result) => {
        if (err) throw err;
        res.send(result);
    })
})


// ini checkout -------------------------------------------------------------------------------------------

app.post("/Checkout", function (req, res) {

    var kode_invoice = "INV" + req.body.userid + (new Date).getMonth() + (new Date).getHours() + (new Date).getSeconds();

    db.query("SELECT * FROM cart where ? and ?",
        [{
            userid: req.body.userid
        },
        {
            status: 'active'
        }],
        function (err, rows1) {

            db.query("INSERT invoice set ?",
                {
                    codeinv: kode_invoice,
                    iduser: req.body.userid,
                    namapenerima: req.body.namapene,
                    alamatpenerima: req.body.alamat,
                    nopenerima: req.body.phone,
                    total: req.body.total,
                    time: new Date
                })

            rows1.forEach(x => {
                db.query("INSERT invoicedetail set ?",
                    {
                        codeinvoice: kode_invoice,
                        prodname: x.namaprod,
                        qty: x.qtycart,
                        harga: x.harga
                    })


                db.query("SELECT stock FROM product WHERE ?",
                    {
                        idprod: x.idproductcart
                    }, (error, row4) => {
                        db.query("UPDATE product SET ? where ?",
                            [
                                {
                                    stock: row4[0].stock - x.qtycart
                                },
                                {
                                    idprod: x.idproductcart
                                }
                            ]), (err, rslt) => {
                                if (err) throw err;

                            }

                    })
            })

            var data = [
                {
                    status: 'inactive'
                },
                {
                    userid: req.body.userid
                }
            ]
            db.query("UPDATE cart SET ? WHERE ? ", data, (err, rslt) => {
                if (err) throw err;

            })


        })

    var redirect_invoice = "OK";
    res.send({ redirect_invoice, kode_invoice });
})
// ini signUp -------------------------------------------------------------------------------------------

app.post("/SignIn", (req, res) => {
    var data = {
        name: req.body.name,
        password: req.body.password,
        phone: req.body.phone,
        email: req.body.email
    }
    var adduser = 'INSERT INTO user set ?'
    db.query(adduser, data, (err, result) => {
        if (err) throw err;
        res.send(result);
    })
})

// ini get cart -------------------------------------------------------------------------------------------

app.get("/MyProfile/:id", (req, res) => {
    var data = req.params.id
    var myprof = 'SELECT * FROM invoice WHERE ?'

    db.query(myprof, data, (err, result) => {
        if (err) throw err;
        res.send(result);
    })

})

// ini detail -------------------------------------------------------------------------------------------

app.get("/Detail/:id", (req, res) => {
    var detail = 'SELECT * FROM invoice WHERE ?'
    db.query(detail, {codeinv : req.params.id},
        (err, result1) => {
            var detailinv = 'SELECT * FROM invoicedetail WHERE ?'
            db.query(detailinv, {codeInvoice : req.params.id}, (err, result2) => {
                if (err) throw err;
                res.send({result1, result2})
            })
        })
})

// ini search -----------------------------------------------------------------------------------------------

app.get("/search/:caris", (req,res)=>{
    var cari = [{status: "active"},'%'+req.params.caris+'%']
    var url = 'SELECT * FROM product where ? AND namaprod LIKE ?'
    db.query(url,cari, (err, result)=>{
        res.send(result)
    }) 
})

//========================================================================================================================================================================================================================

// ini adminbody ----------------------------------------------------------------------------------------------

app.get('/bodyadmin', (req, res) => {
    var data = { status: "active"}
    var sqlget = 'SELECT * FROM product where ?';
    db.query(sqlget,data, (err, result) => {
        if (err) throw err;
        // console.log(result);
        res.send(result);
    });
});


// ini admin add -------------------------------------------------------------------------------------------

app.post("/addProduct",(req,res)=>{
    var data = {
        namaprod: req.body.nama,
        desc: req.body.describ,
        stock: req.body.jumlah,
        harga: req.body.harga,
        status: "active"
    }
    var adduser = 'INSERT INTO product set ?'
    db.query(adduser, data, (err, result) => {
        if (err) throw err;
        var anjay = 'sukses'
        res.send(anjay)
    })
})

// update admin -------------------------------------------------------------------------------------------

app.post('/editProduct/:id', (req, res) => {
    // console.log(req.body)
    // console.log(req.params.id)
    var data = [{
        namaprod: req.body.nama,
        desc: req.body.describ,
        stock: req.body.jumlah,
        harga: req.body.harga
    },
    {
        idprod: req.params.id
    }]
    // console.log(data) 
    var update = `update product set ? where ?`
    db.query(update, data, (err, result) => {
        if (err) throw err;
        var anjay = 'sukses'
        res.send(anjay)
    })
})

// ini delete product admin --------------------------------------------------------------------------

app.post('/productDelete', (req, res) => {
    var data = [
        {
            status: 'inactive'
        },
        {
            idprod: req.body.idprod
        }
    ]
    // console.log(data) 
    var setdelet = `update product set ? where ?`
    db.query(setdelet, data, (err, result) => {
        if (err) throw err;

        res.send(result);
    })
})

// ini admin invoice ----------------------------------------------------------------------------------

app.get("/invoice", (req, res) => {

    var invoice = 'SELECT * FROM invoice'

    db.query(invoice, (err, result) => {
        if (err) throw err;
        res.send(result);
    })

})

// ini admin detail ------------------------------------------------------------------------------------

app.get("/detailadmin/:id", (req, res) => {
    var detail = 'SELECT * FROM invoice WHERE ?'
    db.query(detail, {codeinv : req.params.id},
        (err, result1) => {
            var detailinv = 'SELECT * FROM invoicedetail WHERE ?'
            db.query(detailinv, {codeInvoice : req.params.id}, (err, result2) => {
                if (err) throw err;
                res.send({result1, result2})
            })
        })
})

// ini port -------------------------------------------------------------------------------------------

app.listen(3222, () => {
    console.log('Server @port 3222')
});