var express = require('express');
var mysql = require('mysql')
var app = express();
var bodyparser = require('body-parser');
var cors = require('cors');
// var upload = require('express-fileupload')

const multer = require('multer');
const uuidv4 = require('uuid/v4');
const path = require('path');

// app.use(upload())
app.use(cors());
app.use(bodyparser.json())


//==================================================================================================
// configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        /*
          Files will be saved in the 'img' directory. Make
          sure this directory already exists!
        */
        cb(null, './img');
    },
    filename: (req, file, cb) => {
        /*
          uuidv4() will generate a random ID that we'll use for the
          new filename. We use path.extname() to get
          the extension from the original file name and add that to the new
          generated ID. These combined will create the file name used
          to save the file on the server and will be available as
          req.file.pathname in the router handler.
        */
        const newFilename = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, newFilename);
    },
});
// create the multer instance that will be used to upload/save the file
const upload = multer({ storage });

//=========================================================================================

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
            if (err) throw err;

            let loginstatus
            let iduser
            let nama

            if (result.length > 0) {
                loginstatus = true;
                nama = result[0].name;
                iduser = result[0].iduser;
            }
            else {
                loginstatus = false;
                nama = null;
                iduser = null;
            }

            res.send({ loginstatus, nama, iduser });

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
        var berhasil = 'sukses'
        res.send(berhasil)
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

// uploadgambar ---------------------------------------------------------------------------------------



app.post('/addProduct', (req, res) => {
    var data = {
        namaprod: req.body.nama, 
        desc: req.body.describ,
        stock: req.body.jumlah,
        harga: req.body.harga,
        status: "success"
    }
    var add = 'INSERT INTO product set ?'
    db.query(add, data, (err, result) => {
        if (err) throw err;
        var anjay = 'sukses'
        res.send(anjay)
    })
});
// upload --------------------------------------------------------------------------------------------

app.post('/gambar', upload.single('userfile'), (req, res) => {
var get = `select * from product where ?`
var nama = {namaprod: req.body.nama}
db.query(get,nama,(err, result1)=> {
    if (err) throw err;
    // console.log(result1)
    if (!req.file) {
        
        var data2 = {status: "success"}
        var sql1 = `update product set (img) values ('default.jpg') where ?`
        db.query(sql1,data2,
            function (err, result2) {
                if (err) throw err;
                // console.log(result2)

                var data3 = [{status: "active"},{status: "success"}]
                var sql1 = `update product set ? where ?`
                    db.query(sql1,data3,
                    function (err, result3) {
                    if (err) throw err;

                    // console.log(result3)
                    var a = 'sukses'
                res.send(a)
                
                    })
            })
    }
    else{
        
    var data1 = [{img: req.file.filename},{status: "success"}]
    var sql1 = `update product set ? where ?;`
    db.query(sql1, data1,
        function (err, result4) {
            if (err) throw err;
            // console.log(result4)

            var data5 = [{status: "active"},{status: "success"}]
            var sql1 = `update product set ? where ?`
                db.query(sql1,data5,
                function (err, result5) {
                if (err) throw err;
                // console.log(result5)
                var a = 'sukses'
                res.send(a)
                })

        })
    // console.log(req.file.filename)
    }

})
});
// ini port -------------------------------------------------------------------------------------------

app.listen(3222, () => {
    console.log('Server @port 3222')
});