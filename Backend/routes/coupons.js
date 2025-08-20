const express = require('express');
const { getAsync } = require('../utils/dbHelpers');
const router = express.Router();

// Função auxiliar para validar o cupom
const validateCoupon = async (couponCode, total) => {
    if (!couponCode) {
        return { isValid: false, message: 'Código do cupom não fornecido.' };
    }

    const coupon = await getAsync('SELECT * FROM coupons WHERE code = ?', [couponCode.toUpperCase()]);

    if (!coupon) {
        return { isValid: false, message: 'Cupom inválido.' };
    }
    if (!coupon.is_active) {
        return { isValid: false, message: 'Este cupom não está mais ativo.' };
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { isValid: false, message: 'Cupom expirado.' };
    }
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
        return { isValid: false, message: 'Este cupom atingiu o limite de usos.' };
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
        discountAmount = (total * coupon.discount_value) / 100;
    } else if (coupon.discount_type === 'fixed') {
        discountAmount = coupon.discount_value;
    }
    
    // Garante que o desconto não seja maior que o total
    discountAmount = Math.min(discountAmount, total);

    return { 
        isValid: true, 
        message: 'Cupom aplicado com sucesso!', 
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        coupon 
    };
};


// ROTA CLIENTE - Validar e aplicar um cupom
router.post('/apply', async (req, res) => {
    const { coupon_code, total } = req.body;

    if (!coupon_code || total === undefined) {
    return res.status(400).json({ error: 'Código do cupom e total do carrinho são obrigatórios' });
  }

    try {
        const validationResult = await validateCoupon(coupon_code, total);

        if (!validationResult.isValid) {
            return res.status(400).json({ error: validationResult.message });
        }

        res.json({
            message: validationResult.message,
            discount_amount: validationResult.discountAmount,
            new_total: parseFloat((total - validationResult.discountAmount).toFixed(2))
        });

    } catch (error) {
        res.status(500).json({ error: 'Erro ao validar o cupom.', details: error.message });
    }
});

// Exporta a função de validação para ser usada na rota de pedidos
module.exports = { router, validateCoupon };