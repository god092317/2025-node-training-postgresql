const express = require("express");

const router = express.Router();
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Coach");

router.get("/?per=?pag=?", async(res ,req ,next)=>{

});

router.get("/:coachId", async(res ,req ,next)=>{
    try {

    } catch (error) {
        logger.error(error);
        next(error);
    }   
});

module.exports = router;