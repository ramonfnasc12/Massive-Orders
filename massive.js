const accountName = 'partnerintegrationbra';
const n = 60;
const VtexIdclientAutCookie = "Adicionar Cookie"

const axios = require('axios');

const instance = axios.create({
    headers: {
        VtexIdclientAutCookie,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
})

let orderPut = {
    "items": [{
        "id": "1",
        "quantity": 1,
        "seller": "1",
        "price": 12200,
        "rewardValue": 0,
        "offerings": [],
        "priceTags": [],
        "isGift": false
    }],
    "clientProfileData": {
        "email": "teste@teste.com",
        "firstName": "Teste",
        "lastName": "Teste",
        "document": "39033658828",
        "documentType": "cpf",
        "phone": "+5521988554477",
        "corporateName": null,
        "tradeName": null,
        "corporateDocument": null,
        "stateInscription": null,
        "corporatePhone": null,
        "isCorporate": false
    },
    "shippingData": {
        "id": "shippingData",
        "address": {
            "addressId": "4835155269459",
        },
        "logisticsInfo": [{
            "itemIndex": 0,
            "selectedSla": "jatinho",
            "price": 500
        }]
    },
    "paymentData": {
        "id": "paymentData",
        "payments": [{
            "accountId": "1A7E349D1CA549D189BF4A0062A4B451",
            "bin": "424242",
            "paymentSystem": "2",
            "referenceValue": 12700,
            "value": 12700,
            "installments": 1
        }]
    }
}

const orderPayment = (transactionId) => [
    {
        "hasDefaultBillingAddress": true,
        "installmentsInterestRate": 0,
        "referenceValue": 12700,
        "bin": "424242",
        "accountId": "1A7E349D1CA549D189BF4A0062A4B451",
        "value": 12700,
        "tokenId": null,
        "paymentSystem": "2",
        "isBillingAddressDifferent": false,
        "fields": {
            "dueDate": null,
            "validationCode": "123",
            "bin": "424242",
            "accountId": "1A7E349D1CA549D189BF4A0062A4B451",
            "addressId": "4835155269459",
            "cardNumber": null
        },
        "installments": 1,
        "chooseToUseNewCard": false,
        "id": `${accountName.toUpperCase()}`,
        "interestRate": 0,
        "installmentValue": 12700,
        "transaction": {
            "id": `${transactionId}`,
            "merchantName": `${accountName.toUpperCase()}`
        },
        "installmentsValue": 12700,
        "currencyCode": "BRL",
        "originalPaymentIndex": 0,
        "groupName": "creditCardPaymentGroup"
    }
]
const orders = [];

for (let i = 0; i < n; i++) {
    orders.push(createOrder())
}

Promise.all(orders);

async function createOrder() {
    try {
        //Criar pedido
        const orderResponse = await instance.put(`https://${accountName}.myvtex.com/api/checkout/pub/orders?sc=1`, orderPut);
        
        const headers = orderResponse.headers['set-cookie'];
        let Vtex_CHKO_Auth;
        headers.forEach(cookie => {
            if (cookie.startsWith('Vtex_CHKO_Auth')) {
                Vtex_CHKO_Auth = cookie.split('=')[1].split(';')[0] + `=`
            }
        });
        const transactionId = orderResponse.data.transactionData.merchantTransactions[0].transactionId;
        const orderId = orderResponse.data.orders[0].orderGroup;

        //Criar transação
        await instance.post(`https://${accountName}.vtexpayments.com.br/api/pub/transactions/${transactionId}/payments`, orderPayment(transactionId));
        
        //Processar pagamento
        await instance.post(`https://${accountName}.myvtex.com/api/checkout/pub/gatewayCallback/${orderId}`, {}, {
            headers: {
                'Cookie': `Vtex_CHKO_Auth=${Vtex_CHKO_Auth}`
            }
        })
        
        console.log('Ordem criada: ' + `${orderId}`);
    }
    catch (err) {
        console.log(err)
    }
}