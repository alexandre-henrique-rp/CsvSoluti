import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import { PrismaClient } from '@prisma/client'
import path from 'path';
const prisma = new PrismaClient()

const port = process.env.SERVE_PORT;
const serveConsult = process.env.SERVE_CONSULT;

interface DataUpdate {
  id_fcw_soluti?: string;
  dt_aprovacao?: string | Date;
  validacao?: string;
  andamento?: string;
}

const app = express();
const upload = multer({ dest: './uploads/' }); // Diretório para salvar arquivos CSV temporariamente
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Lista para armazenar os clientes conectados para receber atualizações
const clients = [];

// Endpoint para lidar com solicitações de clientes para receber atualizações de progresso
app.get('/progress-updates', (req, res) => {
  // Defina o cabeçalho para indicar que este endpoint suporta SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Mantenha a conexão aberta
  res.flushHeaders();

  // Adicione o cliente à lista de clientes conectados
  clients.push(res);

  // Remova o cliente da lista quando a conexão for fechada
  req.on('close', () => {
    clients.splice(clients.indexOf(res), 1);
  });
});

// Rota para lidar com a requisição POST contendo o arquivo CSV
app.post('/upload-csv', (req, res) => {
  // Verifique se o corpo da requisição contém o arquivo CSV
  if (!req.body) {
    return res.status(400).send('Nenhum arquivo CSV enviado.');
  }

  // Responda imediatamente com um código de status 200 OK
  res.status(200).send('Arquivo CSV recebido com sucesso. Processamento em andamento.');

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
        // Iterar sobre os objetos JSON resultantes
        let retono: number = 0;
        for (const obj of jsonData) {


          if (obj.referenciaExt[0] === 'V') {
            let Dados: DataUpdate = {};
            const referencia = obj.referenciaExt.slice(2);

            const client = await verifiqueVoucher(referencia);
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
              if (obj.situacao[0] === '3') {
                Dados.andamento = 'APROVADO';
              }
              if (obj.situacao[0] === '4') {
                Dados.andamento = 'EMITIDO';
              }
              if (obj.situacao[0] === '5') {
                Dados.andamento = 'REVOGADO';
              }
            }
            const update = await ClientUpdate(client[0].id, Dados);
            if (update) retono++
            // Calcule o progresso como uma porcentagem
            const progress = Math.floor((retono / jsonData.length) * 100);

            // Envie atualizações de progresso para os clientes conectados
            sendProgressUpdate({ progress });

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
              if (obj.situacao[0] === '3') {
                Dados.andamento = 'APROVADO';
              }
              if (obj.situacao[0] === '4') {
                Dados.andamento = 'EMITIDO';
              }
              if (obj.situacao[0] === '5') {
                Dados.andamento = 'REVOGADO';
              }
            }
            const update = await ClientUpdate(Number(referencia), Dados);
            if (update) retono++

            // Calcule o progresso como uma porcentagem
            const progress = Math.floor((retono / jsonData.length) * 100);

            // Envie atualizações de progresso para os clientes conectados
            sendProgressUpdate({ progress });
          }
        }

        deletarArquivosAntigos('./uploads');
        // Envie os resultados como resposta
        // res.send(`Foi processado ${retono} linhas.`);
        // Remova o arquivo temporário após o processamento
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
        vouchersoluti: voucher
      },
      select: {
        id: true,
        andamento: true,
        nome: true,
      }
    })
    return getCliente
  } catch (error) {
    throw error
  }
}
async function ClientUpdate(id: number, data: DataUpdate) {
  try {
    const UpdateCliente = await prisma.fcweb.update({
      where: {
        id: id
      },
      data: data,
      select: {
        id: true,
        andamento: true,
        nome: true,
        validacao: true,
        dt_aprovacao: true,
        id_fcw_soluti: true
      }
    })
    return UpdateCliente
  } catch (error) {
    throw error
  }
}

// Função para enviar atualizações de progresso para todos os clientes conectados
function sendProgressUpdate(progress: any) {
  const data = `data: ${JSON.stringify(progress)}\n\n`;

  // Verificar se o progresso é 100%
  if (progress.progress === 100) {
    // Encerrar a conexão para indicar que o processamento foi concluído
    clients.forEach(client => {
      client.write(data);
      client.end();
    });

    // Limpar a lista de clientes, pois todas as conexões foram encerradas
    clients.length = 0;
  } else {
    // Caso contrário, enviar atualizações de progresso para os clientes conectados
    clients.forEach(client => {
      client.write(data);
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
          fs.unlink(caminhoCompleto, err => {
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
