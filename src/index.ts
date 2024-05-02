import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';

const port = process.env.SERVE_PORT;
const serveConsult = process.env.SERVE_CONSULT;

const app = express();
const upload = multer({ dest: './uploads/' }); // Diretório para salvar arquivos CSV temporariamente
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Rota para lidar com a requisição POST contendo o arquivo CSV
app.post('/upload-csv', (req, res) => {
  // Verifique se o corpo da requisição contém o arquivo CSV
  if (!req.body) {
    return res.status(400).send('Nenhum arquivo CSV enviado.');
  }

  // Converta o corpo da requisição em uma string
  let csvData = '';
  req.on('data', (chunk) => {
    csvData += chunk.toString();
  });

  req.on('end', () => {
    // Salve o arquivo no disco
    const fileName = `uploaded_${Date.now().toLocaleString()}.csv`;
    const filePath = `uploads/${fileName}`;

    fs.writeFileSync(filePath, csvData);

    // Ler o arquivo CSV e converter em JSON usando csv-parser
    const jsonData: any[] = [];
    fs.createReadStream(filePath, { encoding: 'utf-8' })
      .pipe(csvParser({ separator: ';' })) // Especificando o separador como ;
      .on('data', (row) => {
        jsonData.push(row);
      })
      .on('end', () => {
        // Iterar sobre os objetos JSON resultantes
        for (const obj of jsonData) {
          let Dados: any = {};

          if (obj.referenciaExt[0] === 'V') {
            if (obj.id) {
              Dados.id_fcw_soluti = obj.id;
            }
            Dados.id_fcw_soluti = 'deu certo';
          } 
          console.log(Dados);
        }

        // Envie os resultados como resposta
        res.json(jsonData);
      });
  });
});

app.listen(port, async function () {
  console.log('🚀🚀🤖 servidor em execução 🤖🚀🚀');
  console.log(`🚀🚀🤖 ${serveConsult}${port} 🤖🚀🚀`);
});
