const express = require('express');
var cors = require('cors');
const app = express();
const database = require('./config/db.config');
var bodyParser = require('body-parser')
let yyyymmdd = require("yyyy-mm-dd");
var fs = require('fs');


app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.post('/api/reservation/add', (req, res) => {
    database.query("insert into reservation values (NULL,?,?,?)",
        [
            req.body.stadium_id,
            req.body.date,
            req.body.nb_players
        ],
        function (err, data) {
            if (err) {
                res.send(err);
            } else {
                res.send({ res : "done" })
            }
        });
})

app.post('/api/reservation/update', (req, res) => {
    database.query("update reservation set stadium_id = ?, date = ?, nb_players = ? where id = ? ",
        [
            req.body.stadium_id,
            req.body.date,
            req.body.nb_players,
            req.body.id
        ],
        function (err, data) {
            if (err) {
                res.send(err);
            } else {
                if (data.affectedRows == 1)
                    res.send({ res : "done" });
                else
                    res.send({ res : "No record found !!!" })
            }
        });
})

app.get('/api/reservation/getAll',(req, res) => {
    database.query('SELECT * FROM reservation ', (err, rows, fields) => {
        if (err) {
            res.send(err);
        } else {
            res.send(rows)
        }
    })
})

app.get('/api/reservation/get/:reservationId', (req, res) => {
    database.query('SELECT * FROM reservation WHERE id = ?',
        [req.params.reservationId], (err, rows, fields) => {
            if (err) {
                res.send(err);
            } else {
                res.send(rows[0])
            }
        })
})


app.delete('/api/reservation/delete', (req, res) => {
    database.query("delete from reservation where  id = ?",
        [
            req.query.id
        ],
        function (err, data) {
            if (err) {
                res.send(err);
            } else {
                if (data.affectedRows == 1)
                    res.send({ res : "done" });
                else
                    res.send({ res : "No record found !!!"})
            }
        });
})

app.get('/api/stadium/getAll',((req, res) => {
    database.query('SELECT * FROM stadium', [], (err, rows, fields) => {
            if (err) {
                res.send(err);
            } else {
                res.send(rows)
            }
        })
}))

app.get('/api/stadium/get/:stadiumId',((req, res) => {
    database.query('SELECT * FROM stadium WHERE id = ?',
        [req.params.stadiumId], (err, rows, fields) => {
            if (err) {
                res.send(err);
            } else {
                res.send(rows[0])
            }
        })
}))

app.get('/api/stadium/getAvailableStadiums',((req, res) => {
    let reservationId = null
    if (!req.query?.date) { res.send([]); return;}
    if (req.query?.reservationId) {
        reservationId = req.query?.reservationId
    }
    let wantedStartDate = addHours(1,new Date(req.query.date))
    let wantedEndDate = addHours(2,new Date(req.query.date))
    database.query('SELECT * FROM stadium ', (err, stadiums, fields) => {
        if (err) {
            res.send(err);
        } else {
            for (let i = 0; i<stadiums.length ; i++) {
                let stadium = stadiums[i]
                stadium["available"] = true
                database.query('SELECT * FROM reservation where stadium_id = ' + stadium.id, (err, reservations, fields) => {
                    if (err) {
                        res.send(err);
                    } else {
                        // ALL HERE
                        for (let j=0 ; j<reservations.length; j++){
                            let reservation = reservations[j]
                            if (reservation.id != reservationId){
                                let matchStartTime = addHours(1,new Date(reservation.date))
                                let matchEndTime = addHours(2,new Date(reservation.date))
                                if (wantedStartDate >= matchStartTime && wantedStartDate <= matchEndTime) {
                                    console.log('✅ date is between the 2 dates');
                                    stadium["available"] = false
                                    j = j+reservations.length
                                }
                                if (wantedEndDate >= matchStartTime && wantedEndDate <= matchEndTime) {
                                    console.log('✅ date is between the 2 dates');
                                    stadium["available"] = false
                                    j = j+reservations.length
                                }
                            }
                        }
                    }
                    if (i+1 == stadiums.length){
                        res.send(stadiums.filter(elt => elt.available))
                    }
                })
            }
        }
    })
}))

function addHours(numOfHours, date) {
    date.setTime(date.getTime() + numOfHours * 60 * 60 * 1000);
    return date;
}

app.set('port', process.env.PORT || 8000);

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
