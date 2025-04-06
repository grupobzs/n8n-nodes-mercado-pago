import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

import axios, { AxiosRequestConfig } from 'axios';

export class MercadoPago implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'MercadoPago',
        name: 'mercadoPago',
        icon: 'file:mercadopago.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Interaja com a API do MercadoPago',
        defaults: {
            name: 'MercadoPago',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'mercadoPagoApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operação',
                name: 'operation',
                type: 'options',
                options: [
                    {
                        name: 'Criar Pagamento',
                        value: 'createPayment',
                        description: 'Criar um novo pagamento',
                    },
                    {
                        name: 'Consultar Pagamento',
                        value: 'getPayment',
                        description: 'Consultar um pagamento existente',
                    },
                    {
                        name: 'Cancelar Pagamento',
                        value: 'cancelPayment',
                        description: 'Cancelar um pagamento pendente',
                    },
                ],
                default: 'createPayment',
                required: true,
            },

            {
                displayName: 'Valor',
                name: 'amount',
                type: 'number',
                default: 0,
                displayOptions: {
                    show: {
                        operation: ['createPayment'],
                    },
                },
                required: true,
                description: 'Valor do pagamento',
            },
            {
                displayName: 'Descrição',
                name: 'description',
                type: 'string',
                default: '',
                displayOptions: {
                    show: {
                        operation: ['createPayment'],
                    },
                },
                required: true,
                description: 'Descrição do pagamento',
            },
            {
                displayName: 'Email do Pagador',
                name: 'email',
                type: 'string',
                default: '',
                displayOptions: {
                    show: {
                        operation: ['createPayment'],
                    },
                },
                required: true,
                description: 'Email do pagador',
            },
            {
                displayName: 'Método de Pagamento',
                name: 'paymentMethodId',
                type: 'options',
                options: [
                    {
                        name: 'PIX',
                        value: 'pix',
                    },
                    {
                        name: 'Cartão de Crédito',
                        value: 'credit_card',
                    },
                    {
                        name: 'Boleto',
                        value: 'bolbradesco',
                    },
                ],
                default: 'pix',
                displayOptions: {
                    show: {
                        operation: ['createPayment'],
                    },
                },
                required: true,
                description: 'Método de pagamento',
            },

            {
                displayName: 'ID do Pagamento',
                name: 'paymentId',
                type: 'string',
                default: '',
                displayOptions: {
                    show: {
                        operation: ['getPayment', 'cancelPayment'],
                    },
                },
                required: true,
                description: 'ID do pagamento a ser consultado ou cancelado',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        const credentials = await this.getCredentials('mercadoPagoApi');
        const operation = this.getNodeParameter('operation', 0) as string;

        for (let i = 0; i < items.length; i++) {
            try {
                let responseData;

                if (operation === 'createPayment') {
                    const amount = this.getNodeParameter('amount', i) as number;
                    const description = this.getNodeParameter('description', i) as string;
                    const email = this.getNodeParameter('email', i) as string;
                    const paymentMethodId = this.getNodeParameter('paymentMethodId', i) as string;

                    const options: AxiosRequestConfig = {
                        method: 'POST',
                        url: 'https://api.mercadopago.com/v1/payments',
                        headers: {
                            'Authorization': `Bearer ${credentials.accessToken}`,
                            'Content-Type': 'application/json',
                            'X-Idempotency-Key': Date.now().toString()
                        },
                        data: {
                            transaction_amount: amount,
                            description: description,
                            payment_method_id: paymentMethodId,
                            payer: {
                                email: email
                            }
                        }
                    };

                    responseData = await axios(options);
                } else if (operation === 'getPayment') {
                    const paymentId = this.getNodeParameter('paymentId', i) as string;

                    const options: AxiosRequestConfig = {
                        method: 'GET',
                        url: `https://api.mercadopago.com/v1/payments/${paymentId}`,
                        headers: {
                            'Authorization': `Bearer ${credentials.accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    };

                    responseData = await axios(options);
                } else if (operation === 'cancelPayment') {
                    const paymentId = this.getNodeParameter('paymentId', i) as string;

                    const options: AxiosRequestConfig = {
                        method: 'PUT',
                        url: `https://api.mercadopago.com/v1/payments/${paymentId}`,
                        headers: {
                            'Authorization': `Bearer ${credentials.accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        data: {
                            status: 'cancelled'
                        }
                    };

                    responseData = await axios(options);
                } else {
                    throw new Error(`Operação '${operation}' não é suportada.`);
                }

                const executionData = this.helpers.constructExecutionMetaData(
                    this.helpers.returnJsonArray(responseData.data),
                    { itemData: { item: i } },
                );

                returnData.push(...executionData);
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message } });
                    continue;
                }
                throw error;
            }
        }

        return [returnData];
    }
}
