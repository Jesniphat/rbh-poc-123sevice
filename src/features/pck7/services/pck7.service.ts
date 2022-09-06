import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as forge from 'node-forge';
import * as fs from 'fs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class Pck7Service {
  private readonly logger = new Logger(Pck7Service.name);
  constructor(private readonly httpService: HttpService) {}

  public async genTextData(): Promise<any> {
    const secret = '69OWLBPR5UACQ8RHFFKY2K5KN7H79A55';

    const cst = `764764000011139220829-AC-28491,000.09THBSCBrbh_blank@robinhood.co.th08855555551`;
    const sha256Hasher = crypto.createHmac('sha256', secret);
    const hash = sha256Hasher.update(cst).digest('hex');

    const body = {
      merchant: {
        merchant_id: '764764000011139',
        redirect_url: 'robinhoodth://payment/paywise/220829-AC-2849',
        notification_url:
          'https://b2b-apis-dev.alp-robinhood.com/payment/v1/payment/mobile-banking/confirm',
      },
      transaction: {
        merchant_reference: '220829-AC-2849',
        preferred_agent: 'SCB',
        amount: 1000.09,
        currency_code: 'THB',
        product_description: 'ROBINHOOD_FOOD',
      },
      buyer: {
        buyer_email: 'rbh_blank@robinhood.co.th',
        buyer_mobile: '0885555555',
        buyer_language: 'TH',
        buyer_os: 1,
        notify_buyer: false,
      },
      checksum: hash,
    };

    const jsonBody: string = JSON.stringify(body);

    const publicCerTxt = await this.readPublicCer();
    // create cert object
    const cert = forge.pki.certificateFromPem(publicCerTxt);
    // create envelop data
    const p7 = forge.pkcs7.createEnvelopedData();
    // add certificate as recipient
    p7.addRecipient(cert);
    // set content
    p7.content = forge.util.createBuffer();
    p7.content.putString(jsonBody);

    // encrypt
    p7.encrypt();

    // obtain encrypted data with DER format
    const bytes = forge.asn1.toDer(p7.toAsn1()).getBytes();
    const bodyEncrypted: string = Buffer.from(bytes, 'binary').toString(
      'base64',
    );

    return await this.testCall2c2p(bodyEncrypted);
  }

  public async decodeResponse(respString: string) {
    try {
      const data =
        '-----BEGIN PKCS7-----\r\n' +
        respString +
        '\r\n-----END PKCS7-----\r\n';
      const p7d = forge.pkcs7.messageFromPem(data);

      const privateCertString = await this.readPrivateCer();
      const privateCert = forge.pki.decryptRsaPrivateKey(privateCertString);

      p7d.decrypt(p7d.recipients[0], privateCert);
      const resp = p7d.content;
      console.log(resp);
      return JSON.parse(resp.data);
    } catch (e) {
      console.log('decode error');
      console.log(e);
    }
  }

  private async testCall2c2p(body: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.httpService
        .post(
          'https://th-merchants-proxy-v1-uat-123.2c2p.com/api/merchantenc/start-deeplink-request',
          { message: body },
        )
        .subscribe({
          next: (resp) => {
            console.log('call success');
            console.log('data is -> ', resp.data);
            resolve(resp.data);
          },
          error: (e) => {
            console.log(e);
            reject(
              new HttpException(`Call 2c2p error`, HttpStatus.BAD_REQUEST),
            );
          },
        });
    });
  }

  private async readPublicCer(): Promise<string> {
    try {
      return fs.readFileSync(
        '/Users/jesniphat.phukkham/ScbTechx/2c2p/123UATSECURE16-Publickey.cer',
        'utf8',
      );
    } catch (e) {
      this.logger.error(`read public cer error. ${e?.message}`);
      throw new HttpException('Read cer error', HttpStatus.BAD_REQUEST);
    }
  }

  private async readPrivateCer(): Promise<string> {
    try {
      return fs.readFileSync(
        '/Users/jesniphat.phukkham/ScbTechx/2c2p/rbh-nonprod.pk8',
        'utf8',
      );
    } catch (e) {
      this.logger.error(`read private cer error. ${e?.message}`);
      throw new HttpException('Read private cer error', HttpStatus.BAD_REQUEST);
    }
  }
}
