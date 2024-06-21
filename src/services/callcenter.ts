import { EmailSend } from './email';
import WhatsApp from './whatsapp';

interface Data {
  status: string;
  voucher: string;
  nome: string;
  telefone: string;
  dataAprovacao: string | Date;
  produto: string;
  agr: string;
}

export const CallCenter = (data: Data[]) => {
  const lista = [
    { nome: 'Alexandre', tel: '16996029107' },
    { nome: 'Alex', tel: '16996065845' },
    { nome: 'Alvaro', tel: '16988078540' },
  ];

  const ListaData = data.map((obj: Data, index: number) => {
    console.log(obj);
    return `${index + 1}\n[ \nNome: ${obj.nome}\nTelefone: ${obj.telefone}\nVoucher: ${obj.voucher}\nData de Apravação: ${obj.dataAprovacao}\nAgr: ${obj.agr} ]\n\n`;
  });

  for (const obj of lista) {
    const nsg = `Ola ${obj.nome},\nNo csv foi encontado os seguintes vouchers, que não possuem ficha de cadastro\n\nFavor verificar os seguintes clientes  \n\n${ListaData}`;
    (async() => {
      await WhatsApp.sendText(obj.tel, nsg);
    })();
  }

  const EmailSendText = `<!DOCTYPE html>
<html lang="pt-Br">
<body>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      height: 100dvh;
      width: 100dvw;
      font-size: 1.2rem;
    }

    table, tr, th, td {
      border: 1px solid black;
      border-collapse: collapse;
    }

    .container {
      width: 75%;
      margin: 0 auto;
    }
  </style>

  <div class="container">
    <h1>Linsta de Vouchers</h1>
    <br/>
    <br/>
    <p>Os vouchers abaixo não possuem ficha de cadastro, favor verificar</p>
    <br/>
    <br/>
    <table>
      <thead>
        <tr>
          <th>status</th>
          <th>voucher</th>
          <th>nome</th>
          <th>Data Aprovação</th>
          <th>produto</th>
          <th>Agr Reesponsavel</th>
        </tr>
      </thead>

      <tbody>
      ${data.map((obj: Data) => {
        return `<tr>
          <td>${obj.status}</td>
          <td>${obj.voucher}</td>
          <td>${obj.nome}</td>
          <td>${obj.dataAprovacao}</td>
          <td>${obj.produto}</td>
          <td>${obj.agr}</td>
        </tr>`;
      })}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  (async() => {
    await EmailSend(EmailSendText);
  })();

};
