const express = require("express");
const router = express.Router();
const { dataSource } = require("../db/data-source");
const logger = require('../utils/logger')('Cart');
const { verifyToken } = require("../middlewares/auth");
const {isNotValidString, isNotValidInteger} = require("../utils/validUtils");


// 查看購物車
router.get("/", verifyToken, async(req, res, next)=> {
    try{
        const {id} = req.user;
        const cartRepo = dataSource.getRepository("CartItems");
        const cartItems = await cartRepo.find({
            where:{ user_id: id },
            relations :[ "Products" ],
            order:{ updated_at: "DESC"}
        });
        console.log(cartItems);
        const result = cartItems.map((item)=> ({
            "cartItemId": item.id,
            "productId": item.Products.id,
            "productsTitle": item.Products.title,
            "price": item.Products.price,
            "discountPrice": item.Products.discount_price,
            "quantity": item.quantity,   
            "subtotal": parseFloat(
                            item.Products.discount_price != null 
                            ? item.Products.discount_price 
                            : item.price) * item.quantity,
            "stockQuantity": item.Products.stock_quantity,
        }));

        res.status(200).json({
            "status": "true",
            "message": "成功取得購物車",
            "data": result
        });
    }catch(error){
        logger.error("取得購物車失敗: ", error);
        next(error);
    }
});
// 把商品加入購物車
router.post("/", verifyToken, async(req, res, next)=> {
    // 提取使用者輸入的資料
    // 判斷 1: 使用者輸入的資料是否符合格式（productId, quantity）
    // 判斷 2: 是否有這個商品 id, 充足的庫存數量, 上架與否
    // 判斷 3: 是否商品有折扣
    // 判斷 4: 尋找之前使用者的購物車是否有留下商品
    // 若有則將商品數量累加並更新時間；若無則將商品新加入
    // 將使用者輸入的資料寫入資料庫      
    try{
        const {id} = req.user;
        // const sessionId = req.sessionID;
        // 提取使用者輸入的資料
        const {
            "product_id": productId,
            quantity = 1                // 若使用者沒有這行 quantity，則預設為 1
        } = req.body;
        // 判斷 1: 使用者輸入的資料是否符合格式（productId, quantity）
        if( !productId || isNotValidInteger(productId) || 
        !quantity || isNotValidInteger(quantity)){
            res.status(400).json({
                "status": "false",
                "message": "欄位填寫錯誤"
            });
            return;
        }

        // 判斷 2: 是否有這個商品 id 和 充足的庫存數量
        const productsRepo = dataSource.getRepository("Products");
        const findProduct = await productsRepo.findOne({
            select:["id", "title", "price", "discount_price", "stock_quantity", "is_discount", "is_visible"],
            where:{id : productId}
        });
            
        if(!findProduct){
            res.status(404).json({
                "status": "false",
                "message": "找不到該商品"                
            });
            return;
        }else if(findProduct.stock_quantity < quantity){
            res.status(404).json({
                "status": "false",
                "message": `該商品庫存不足，目前僅剩 ${findProduct.stock_quantity} 本`,
                "available_stock": findProduct.stock_quantity
            });
            return;
        }else if(!findProduct.is_visible){
            res.status(404).json({
                "status": "false",
                "message": "該商品未上架"
            });
            return;          
        }

        // 判斷 3: 是否商品有折扣
        const cartRepo = dataSource.getRepository("CartItems");
        let price = null;
        if(findProduct.is_discount){
            price = findProduct.discount_price;
        }else{
            price = findProduct.price;
        }

        // 判斷 4: 尋找之前使用者的購物車是否有留下商品
        let cartItem = await cartRepo.findOne({
            where: { 
                "user_id": id,
                "product_id": productId}
        });
        if (cartItem) {
            cartItem.quantity += quantity;
            cartItem.updated_at = new Date();
            await cartRepo.save(cartItem);
        } else {
            const newItem = cartRepo.create({
                "user_id": id,
                "product_id": productId,
                quantity,
                price,
                "created_at": new Date(),
                "updated_at": new Date()
        });
            await cartRepo.save(newItem);
        }
        res.status(200).json({
            "status": "true",
            "message": "商品已成功加入購物車",
            "data": null 
        });

    }catch(error){
        logger.error("加入購物車失敗: ", error);
        next(error);
    }
});
// 修改購物車內商品數量
router.put("/:cartItemId", verifyToken, async(req, res, next)=> {
    // 提取 使用者資料（cartItemId, user.id, req.body） 提取 req.body 是都會變成字串嗎？
    // 判斷 1: 使用者輸入的資料是否符合格式（cartItemId, quantity）
    // 判斷 2: 搜尋 cart 資料表 該userId 底下有無 cartItemId
    // 判斷 3: 確認 cartItemId 的庫存足夠
    // 更新 cart 資料表的資料
    try{
        const {id} = req.user;
        const {cartItemId} = req.params;
        const {quantity} = req.body;
        // const quantityInt = parseInt(quantity, 10);
        // const cartItemIdInt = parseInt(cartItemId, 10);
        // if(isNaN(cartItemIdInt) || isNotValidInteger(cartItemIdInt) || 
        // isNaN(quantityInt) || isNotValidInteger(quantityInt)){
        if(isNotValidInteger(cartItemId) || isNotValidInteger(quantity)){
            res.status(400).json({
                "status": "false",
                "message": "欄位填寫錯誤"
            });
            return;
        }
        
    }catch(error){
        logger.error("修改購物車商品失敗: ", error);
        next(error);        
    }
});
// 刪除購物車內指定商品
router.delete("/:cartItemId", verifyToken, async(req, res, next)=> {
    // 取得 user.id
    // 藉由 user.id 去撈資料庫的資料，取得該 user 在購物車資料表的資料
});
// 清空購物車？
router.delete("/", verifyToken, async(req, res, next)=> {

});
// 確認購物車結帳（送出訂單）？
router.post("/checkout", verifyToken, async(req, res, next)=> {

});

module.exports = router;