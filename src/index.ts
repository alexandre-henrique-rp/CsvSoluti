import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { CallCenter } from './services/callcenter';
const prisma = new PrismaClient();

const port = process.env.SERVE_PORT;
const serveConsult = process.env.SERVE_CONSULT;

interface DataUpdate {
  id_fcw_soluti?: string;
  dt_aprovacao?: string | Date;
  validacao?: string;
  andamento?: string;
  vouchersoluti?: string;
  vctoCD?: string | Date;
  tipocd?: string;
  observacao?: string;
}

const app = express();
const upload = multer({ dest: './uploads/' }); // Diretório para salvar arquivos CSV temporariamente
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Lista para armazenar os clientes conectados para receber atualizações
const clients = [];
let retono: number = 0;

// Rota para lidar com a requisição POST contendo o arquivo CSV
app.post('/upload-csv', upload.single('file'), (req, res) => {
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
    const fileName = `uploaded_${new Date().toISOString()}.csv`;
    const filePath = `uploads/${fileName}`;

    fs.writeFileSync(filePath, csvData);

    // Ler o arquivo CSV e converter em JSON usando csv-parser
    const jsonData: any[] = [];
    fs.createReadStream(filePath, { encoding: 'utf-8' })
      .pipe(csvParser({ separator: ';' })) // Especificando o separador como ;
      .on('data', (row) => {
        jsonData.push(row);
      })
      .on('end', async () => {
        // Responda imediatamente com um código de status 200 OK
        res
          .status(200)
          .send('Foram processados ' + jsonData.length + ' linhas.');
        // Iterar sobre os objetos JSON resultantes
        let retono: number = 0;
        const error = [];
        for (const obj of jsonData) {
          if (obj.referenciaExt[0] === 'V') {
            let Dados: DataUpdate = {};
            const referencia = obj.referenciaExt.split('-')[1];
            const request = await verifiqueVoucher(referencia);
            const [client] = request;
            if (client) {
              if (obj.id) {
                Dados.id_fcw_soluti = obj.id;
              }
              if (obj.solicitacao) {
                Dados.vouchersoluti = referencia;
                Dados.observacao = obj.solicitacao.split(' ')[0];
              }
              if (obj.dataAprovacao) {
                Dados.dt_aprovacao = new Date(obj.dataAprovacao);
              }
              if (obj.videoconferencia === 'Sim') {
                Dados.validacao = 'VIDEO CONF';
              }
              if (obj.certificado.includes('PJ A1 V5')) {
                if (obj.validade) {
                  Dados.vctoCD = new Date(obj.validade);
                } else {
                  const aprovacao = new Date(obj.dataAprovacao);
                  Dados.vctoCD = new Date(
                    aprovacao.setFullYear(aprovacao.getFullYear() + 1),
                  );
                }
              }
              if (obj.certificado.includes('PJ A3 V5')) {
                if (obj.validade) {
                  Dados.vctoCD = new Date(obj.validade);
                } else {
                  const aprovacao = new Date(obj.dataAprovacao);
                  Dados.vctoCD = new Date(
                    aprovacao.setFullYear(aprovacao.getFullYear() + 3),
                  );
                }
              }
              if (obj.certificado.includes('PF A1 V5')) {
                if (obj.validade) {
                  Dados.vctoCD = new Date(obj.validade);
                } else {
                  const aprovacao = new Date(obj.dataAprovacao);
                  Dados.vctoCD = new Date(
                    aprovacao.setFullYear(aprovacao.getFullYear() + 1),
                  );
                  Dados.tipocd = 'A1PF';
                }
              }
              if (obj.certificado.includes('PF A3 V5')) {
                if (obj.validade) {
                  Dados.vctoCD = new Date(obj.validade);
                } else {
                  const aprovacao = new Date(obj.dataAprovacao);
                  Dados.vctoCD = new Date(
                    aprovacao.setFullYear(aprovacao.getFullYear() + 3),
                  );
                }
              }
              if (obj.certificado.includes('PJ A3 - 2 anos V5')) {
                if (obj.validade) {
                  Dados.vctoCD = new Date(obj.validade);
                } else {
                  const aprovacao = new Date(obj.dataAprovacao);
                  Dados.vctoCD = new Date(
                    aprovacao.setFullYear(aprovacao.getFullYear() + 2),
                  );
                }
              }
              if (obj.certificado.includes('PF A3 - 2 anos V5')) {
                if (obj.validade) {
                  Dados.vctoCD = new Date(obj.validade);
                } else {
                  const aprovacao = new Date(obj.dataAprovacao);
                  Dados.vctoCD = new Date(
                    aprovacao.setFullYear(aprovacao.getFullYear() + 2),
                  );
                }
              }
              if (obj.certificado.includes('PF A3 - 1 ano V5')) {
                if (obj.validade) {
                  Dados.vctoCD = new Date(obj.validade);
                } else {
                  const aprovacao = new Date(obj.dataAprovacao);
                  Dados.vctoCD = new Date(
                    aprovacao.setFullYear(aprovacao.getFullYear() + 1),
                  );
                }
              }
              if (obj.certificado.includes('PJ A3 - 1 ano V5')) {
                if (obj.validade) {
                  Dados.vctoCD = new Date(obj.validade);
                } else {
                  const aprovacao = new Date(obj.dataAprovacao);
                  Dados.vctoCD = new Date(
                    aprovacao.setFullYear(aprovacao.getFullYear() + 1),
                  );
                }
              }
              if (obj.certificado.includes('Bird ID')) {
                if (obj.validade) {
                  Dados.vctoCD = new Date(obj.validade);
                } else {
                  const aprovacao = new Date(obj.dataAprovacao);
                  Dados.vctoCD = new Date(
                    aprovacao.setFullYear(aprovacao.getFullYear() + 5),
                  );
                }
              }

              if (obj.emissaoOnline === 'Sim') {
                Dados.validacao = 'EMISSAO_ONLINE';
              }
              if (obj.situacao) {
                if (obj.situacao.match(/\d+/)[0] == 3) {
                  Dados.andamento = 'APROVADO';
                }
                if (obj.situacao.match(/\d+/)[0] == 4) {
                  Dados.andamento = 'EMITIDO';
                }
                if (obj.situacao.match(/\d+/)[0] == 5) {
                  Dados.andamento = 'REVOGADO';
                }
              }
              const update = await ClientUpdate(client?.id, Dados);
              if (update) retono++;
            } else {
              error.push({
                status: obj.status,
                voucher: referencia,
                nome: obj.titular,
                telefone: obj.telefone,
                dataAprovacao: new Date(obj.dataAprovacao).toISOString(),
                produto: obj.extProdutoNome,
                agr: obj.usuario,
              });
            }
          } else {
            let Dados: DataUpdate = {};
            const referencia = obj.referenciaExt.split(':')[1];
            if (obj.id) {
              Dados.id_fcw_soluti = obj.id;
            }
            if (obj.dataAprovacao) {
              Dados.dt_aprovacao = new Date(obj.dataAprovacao);
            }
            if (obj.videoconferencia === 'Sim') {
              Dados.validacao = 'VIDEO CONF';
            }
            if (obj.emissaoOnline === 'Sim') {
              Dados.validacao = 'EMISAO_ONLINE';
            }
            if (obj.situacao) {
              if (obj.situacao.match(/\d+/)[0] == 3) {
                Dados.andamento = 'APROVADO';
              }
              if (obj.situacao.match(/\d+/)[0] == 4) {
                Dados.andamento = 'EMITIDO';
              }
              if (obj.situacao.match(/\d+/)[0] == 5) {
                Dados.andamento = 'REVOGADO';
              }
            }
            const update = await ClientUpdate(Number(referencia), Dados);
            if (update) retono++;
          }
        }

        // eviar via email
        // enviar via whastapp
        if (error.length > 0) {
          CallCenter(error);
        }
        deletarArquivosAntigos('./uploads');
        // // Envie os resultados como resposta
        // // res.send(`Foi processado ${retono} linhas.`);
        // // Remova o arquivo temporário após o processamento
      });
  });
});

app.listen(port, async function () {
  console.log('🚀🚀🤖 servidor em execução 🤖🚀🚀');
  console.log(`🚀🚀🤖 ${serveConsult}${port} 🤖🚀🚀`);
});

async function verifiqueVoucher(voucher: string) {
  try {
    const getCliente = await prisma.fcweb.findMany({
      where: {
        vouchersoluti: voucher,
      },
      select: {
        id: true,
        andamento: true,
        nome: true,
      },
    });
    return getCliente;
  } catch (error) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = `error_log_perquisa_${timestamp}.json`;
    const logFilePath = `erros/${logFileName}`;

    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack, // Inclui o stack trace para mais detalhes do erro
      error: error,
    };
    // Cria o arquivo de log JSON e salva o objeto de erro
    fs.writeFile(logFilePath, JSON.stringify(errorLog, null, 2), (err) => {
      if (err) {
        console.error('Erro ao salvar o log:', err);
      } else {
        console.log('Log de erro salvo com sucesso:', logFileName);
      }
    });
  }
}
async function ClientUpdate(id: number, data: DataUpdate) {
  try {
    const UpdateCliente = await prisma.fcweb.update({
      where: {
        id: id,
      },
      data: data,
      select: {
        id: true,
        andamento: true,
        nome: true,
        validacao: true,
        dt_aprovacao: true,
        id_fcw_soluti: true,
      },
    });
    return UpdateCliente;
  } catch (error) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = `error_log_Update_${timestamp}.json`;
    const logFilePath = `erros/${logFileName}`;

    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack, // Inclui o stack trace para mais detalhes do erro
      error: error,
    };
    // Cria o arquivo de log JSON e salva o objeto de erro
    fs.writeFile(logFilePath, JSON.stringify(errorLog, null, 2), (err) => {
      if (err) {
        console.error('Erro ao salvar o log:', err);
      } else {
        console.log('Log de erro salvo com sucesso:', logFileName);
      }
    });
  }
}

function deletarArquivosAntigos(diretorio: string) {
  fs.readdir(diretorio, (err, arquivos) => {
    if (err) {
      console.error('Erro ao ler diretório:', err);
      return;
    }

    for (let i = 0; i < arquivos.length; i++) {
      const arquivo = arquivos[i];
      const caminhoCompleto = path.join(diretorio, arquivo);

      // Verificar se o arquivo é um arquivo de log com base no seu nome
      if (arquivo.startsWith('uploaded_') && arquivo.endsWith('.csv')) {
        // Extrair a data do nome do arquivo
        const dataString = arquivo.split('_')[1].split('.')[0]; // Extrai a parte da data do nome do arquivo
        const dataCriacao = new Date(dataString);

        // Verificar se a data de criação é mais antiga do que 90 dias
        const noventaDiasEmMS = 90 * 24 * 60 * 60 * 1000; // 90 dias em milissegundos
        const agora = new Date();

        if (agora.getTime() - dataCriacao.getTime() > noventaDiasEmMS) {
          console.log('Arquivo antigo encontrado:', arquivo);
          // Excluir o arquivo permanentemente
          fs.unlink(caminhoCompleto, (err) => {
            if (err) {
              console.error('Erro ao excluir o arquivo:', caminhoCompleto, err);
            } else {
              console.log('Arquivo excluído:', caminhoCompleto);
            }
          });
        } else {
          console.log('Arquivo recente encontrado:', arquivo);
          // Aqui você pode adicionar a lógica para manter o arquivo
        }
      }
    }
  });
}
