const accountName = 'partnerintegrationbra';
const n = 20;
const VtexIdclientAutCookie = "Coloque aqui o Token"
const itemsList = [
    "1",
    "6"
]

const axios = require('axios');
const instance = axios.create({
    headers: {
        VtexIdclientAutCookie,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
})

function generateRandomIntegerInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const itemSimulation = id =>
({
    id,
    "quantity": 1,
    "seller": "1"
});

const simulationRequest = (itemsSimulation) => ({
    "items": itemsSimulation,
    "postalCode": "22270-030",
    "country": "BRA"
});

const orderPut = (items,logisticsInfo,totalPrice) => ({
    items,
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
        logisticsInfo
    },
    "paymentData": {
        "id": "paymentData",
        "payments": [{
            "accountId": "1A7E349D1CA549D189BF4A0062A4B451",
            "bin": "424242",
            "paymentSystem": "2",
            "referenceValue": totalPrice,
            "value": totalPrice,
            "installments": 1
        }]
    }
})

const orderPayment = (transactionId, totalPrice) => [
    {
        "hasDefaultBillingAddress": true,
        "installmentsInterestRate": 0,
        "referenceValue": totalPrice,
        "bin": "424242",
        "accountId": "1A7E349D1CA549D189BF4A0062A4B451",
        "value": totalPrice,
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
        "installmentValue": totalPrice,
        "transaction": {
            "id": `${transactionId}`,
            "merchantName": `${accountName.toUpperCase()}`
        },
        "installmentsValue": totalPrice,
        "currencyCode": "BRL",
        "originalPaymentIndex": 0,
        "groupName": "creditCardPaymentGroup"
    }
]
const orders = [];

for (let i = 0; i < n; i++) {
    const itemsSimulation = [];
    for (let j=0; j<5; j++){
        itemsSimulation.push(itemSimulation(itemsList[generateRandomIntegerInRange(0,itemsList.length-1)]))
    }
    orders.push(createOrder(simulationRequest(itemsSimulation)))
}

Promise.all(orders);

async function createOrder(simulationRequest) {
    try {
        //Criar pedido
        const simulationResponse = await instance.post(`https://${accountName}.myvtex.com/api/checkout/pvt/orderforms/simulation?sc=1`, simulationRequest);
        const items = []
        const simulationItems = simulationResponse.data.items
        simulationItems.forEach(item => {
            const sku = {
                "id": item.id,
                "quantity": item.quantity,
                "seller": "1",
                "sellerChain": item.sellerChain,
                "price": item.price,
                "rewardValue": 0,
                "offerings": [],
                "priceTags": [],
                "isGift": false
            } 
            items.push(sku)
        });

        const logisticInfo=[]
        const simulationLogistic = simulationResponse.data.logisticsInfo
        simulationLogistic.forEach(element => {
            logisticInfo.push({
                "itemIndex": element.itemIndex,
                "selectedSla": element.slas[0].id,
                "price": element.slas[0].price
            })
        })
        
        let totalPrice = 0;
        items.forEach(element => totalPrice = totalPrice + element.price*element.quantity)
        logisticInfo.forEach(element => totalPrice = totalPrice + element.price)
        

        const orderResponse = await instance.put(`https://${accountName}.myvtex.com/api/checkout/pub/orders?sc=1`, orderPut(items, logisticInfo, totalPrice));

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
        await instance.post(`https://${accountName}.vtexpayments.com.br/api/pub/transactions/${transactionId}/payments`, orderPayment(transactionId, totalPrice));

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