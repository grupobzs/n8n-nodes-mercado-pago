import {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class MercadoPagoApi implements ICredentialType {
    name = 'mercadoPagoApi';
    displayName = 'MercadoPago API';
    documentationUrl = 'https://www.mercadopago.com.br/developers/pt/reference';
    properties: INodeProperties[] = [
        {
            displayName: 'Access Token',
            name: 'accessToken',
            type: 'string',
            default: '',
            required: true,
        },
    ];
}
