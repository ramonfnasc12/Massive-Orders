const accountName = 'avonqa';
const n = 1;
const VtexIdclientAutCookie = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjNCMTM2MEE3Q0E5MTExNThCMUNGQzA4RTdEQ0Q3QjVCRjI4OEY4NTAiLCJ0eXAiOiJqd3QifQ.eyJzdWIiOiJyYW1vbi5uYXNjaW1lbnRvQHZ0ZXguY29tLmJyIiwiYWNjb3VudCI6ImF2b25xYSIsImF1ZGllbmNlIjoiYWRtaW4iLCJzZXNzIjoiMzQ1ZmYwN2MtNDEzMC00ZjFmLTkwMjYtNWY5ZTFhYzA1M2E5IiwiZXhwIjoxNjI4MTcxMjA4LCJ1c2VySWQiOiJmNDRjYTMzOC05YmZlLTRlNWUtYjMwYS1jN2UwYWMyNDI1NzAiLCJpYXQiOjE2MjgwODQ4MDgsImlzcyI6InRva2VuLWVtaXR0ZXIiLCJqdGkiOiIyM2M0NTM0MS05YTI3LTQyYzYtYmVmYy01NTk5MTAwNjgyNWYifQ.bW6Tiitsj7bZfx8QHsxK9xU4Q9IDBFFVCj5-eZH6V3f5AMCp1Re1QQQkgI8z1J1sMOxMNV9pUvOQpdpChG2XNQ"
const itemsList = [
    '76176123',
    '76173458',
    '119231204',
    '119231210',
    '76175278',
    '83391634',
    '76175175',
    '90917754',
    '76173202',
    '81944833',
    '76175698',
    '119231214',
    '99080720',
    '76173680',
    '119231207',
    '76376809',
    '119231205',
    '119231202',
    '119231208',
    '119231211',
    '119231212',
    '104385234',
    '76177733',
    '76176151',
    '79288370',
    '99990479',
    '119231213',
    '119231201',
    '76175960',
    '76178591',
    '119231218',
    '119231200',
    '76177162',
    '78517870',
    '78517689',
    '76175719',
    '119231206',
    '119231216',
    '76174620',
    '119231215',
    '76176622',
    '76176739',
    '82966246',
    '76176717',
    '76176622',
    '79160760',
    '76172982',
    '82966246',
    '76173034',
    '76173057',
    '76176622'
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
    "postalCode": "04272-300",
    "country": "BRA"
});

const orderPut = (items, logisticsInfo, totalPrice) => ({
    items,
    "clientProfileData": {
        "email": "bruna.baldaconi@avon.com",
        "firstName": "Bruna",
        "lastName": "Baldaconi",
        "document": "38417853871",
        "documentType": "cpf",
        "phone": "+5511983585555",
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
            "addressId": "1625680876285",
        },
        logisticsInfo
    },
    "paymentData": {
        "id": "paymentData",
        "payments": [{
            "accountId": "4F18E88303B1494BAF41809A443E8F6B",
            "bin": "518745",
            "paymentSystem": "4",
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
        "bin": "518745",
        "accountId": "4F18E88303B1494BAF41809A443E8F6B",
        "value": totalPrice,
        "tokenId": null,
        "paymentSystem": "4",
        "isBillingAddressDifferent": false,
        "fields": {
            "dueDate": null,
            "validationCode": "980",
            "bin": "518745",
            "accountId": "4F18E88303B1494BAF41809A443E8F6B",
            "addressId": "1625680876285",
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
    let itemsSimulation = [];
    const seen = new Set();

    for (let j = 0; j < 5; j++) {
        itemsSimulation.push(itemSimulation(itemsList[generateRandomIntegerInRange(0, itemsList.length - 1)]))
    }
    //console.log(itemsSimulation)
    itemsSimulation = itemsSimulation.filter(el => {
        const duplicate = seen.has(el.id);
        seen.add(el.id);
        return !duplicate;
      });
    orders.push(createOrder(simulationRequest(itemsSimulation)))
}

Promise.all(orders);

async function createOrder(simulationRequest) {
    try {
        //Criar pedido
        //console.log(simulationRequest)
        const simulationResponse = await instance.post(`https://${accountName}.myvtex.com/api/checkout/pvt/orderforms/simulation?sc=1`, simulationRequest);
        const items = []
        const simulationItems = simulationResponse.data.items
        simulationItems.forEach((item) => {
            const sku = {
                "id": item.id,
                "quantity": "1",
                "seller": "1",
                "price": item.sellingPrice,
                "rewardValue": 0,
                "offerings": [],
                "isGift": item.requestIndex !== null ? false : true
            }
            items.push(sku)
        });
        //console.log(items);

        const logisticInfo = []
        const simulationLogistic = simulationResponse.data.logisticsInfo
        simulationLogistic.forEach(element => {
            logisticInfo.push({
                "itemIndex": element.itemIndex,
                "selectedSla": element.slas[0].id,
                "price": element.slas[0].price
            })
        })
        //console.log(logisticInfo)
        let totalPrice = 0;
        simulationResponse.data.totals.forEach(item => {
            totalPrice = totalPrice + item.value
        });
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