"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const port = process.env.SERVE_PORT;
const serveConsult = process.env.SERVE_CONSULT;
const app = (0, express_1.default)();
const upload = (0, multer_1.default)({ dest: './uploads/' }); // Diretório para salvar arquivos CSV temporariamente
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
// Lista para armazenar os clientes conectados para receber atualizações
const clients = [];
let retono = 0;
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
        const fileName = `uploaded_${new Date().toISOString()}.csv`;
        const filePath = `uploads/${fileName}`;
        fs_1.default.writeFileSync(filePath, csvData);
        // Ler o arquivo CSV e converter em JSON usando csv-parser
        const jsonData = [];
        fs_1.default.createReadStream(filePath, { encoding: 'utf-8' })
            .pipe((0, csv_parser_1.default)({ separator: ';' })) // Especificando o separador como ;
            .on('data', (row) => {
            jsonData.push(row);
        })
            .on('end', async () => {
            // Responda imediatamente com um código de status 200 OK
            res
                .status(200)
                .send('Foram processados ' + jsonData.length + ' linhas.');
            // Iterar sobre os objetos JSON resultantes
            let retono = 0;
            for (const obj of jsonData) {
                if (obj.referenciaExt[0] === 'V') {
                    let Dados = {};
                    const referencia = obj.referenciaExt.slice(2);
                    const client = await verifiqueVoucher(referencia);
                    console.log(obj.id);
                    if (obj.id) {
                        Dados.id_fcw_soluti = obj.id;
                    }
                    if (obj.solicitacao) {
                        Dados.vouchersoluti = obj.solicitacao.split(' ')[0];
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
                        }
                        else {
                            const aprovacao = new Date(obj.dataAprovacao);
                            Dados.vctoCD = new Date(aprovacao.setFullYear(aprovacao.getFullYear() + 1));
                        }
                    }
                    if (obj.certificado.includes('PJ A3 V5')) {
                        if (obj.validade) {
                            Dados.vctoCD = new Date(obj.validade);
                        }
                        else {
                            const aprovacao = new Date(obj.dataAprovacao);
                            Dados.vctoCD = new Date(aprovacao.setFullYear(aprovacao.getFullYear() + 3));
                        }
                    }
                    if (obj.certificado.includes('PF A1 V5')) {
                        if (obj.validade) {
                            Dados.vctoCD = new Date(obj.validade);
                        }
                        else {
                            const aprovacao = new Date(obj.dataAprovacao);
                            Dados.vctoCD = new Date(aprovacao.setFullYear(aprovacao.getFullYear() + 1));
                            Dados.tipocd = 'A1PF';
                        }
                    }
                    if (obj.certificado.includes('PF A3 V5')) {
                        if (obj.validade) {
                            Dados.vctoCD = new Date(obj.validade);
                        }
                        else {
                            const aprovacao = new Date(obj.dataAprovacao);
                            Dados.vctoCD = new Date(aprovacao.setFullYear(aprovacao.getFullYear() + 3));
                        }
                    }
                    if (obj.certificado.includes('PJ A3 - 2 anos V5')) {
                        if (obj.validade) {
                            Dados.vctoCD = new Date(obj.validade);
                        }
                        else {
                            const aprovacao = new Date(obj.dataAprovacao);
                            Dados.vctoCD = new Date(aprovacao.setFullYear(aprovacao.getFullYear() + 2));
                        }
                    }
                    if (obj.certificado.includes('PF A3 - 2 anos V5')) {
                        if (obj.validade) {
                            Dados.vctoCD = new Date(obj.validade);
                        }
                        else {
                            const aprovacao = new Date(obj.dataAprovacao);
                            Dados.vctoCD = new Date(aprovacao.setFullYear(aprovacao.getFullYear() + 2));
                        }
                    }
                    if (obj.certificado.includes('PF A3 - 1 ano V5')) {
                        if (obj.validade) {
                            Dados.vctoCD = new Date(obj.validade);
                        }
                        else {
                            const aprovacao = new Date(obj.dataAprovacao);
                            Dados.vctoCD = new Date(aprovacao.setFullYear(aprovacao.getFullYear() + 1));
                        }
                    }
                    if (obj.certificado.includes('PJ A3 - 1 ano V5')) {
                        if (obj.validade) {
                            Dados.vctoCD = new Date(obj.validade);
                        }
                        else {
                            const aprovacao = new Date(obj.dataAprovacao);
                            Dados.vctoCD = new Date(aprovacao.setFullYear(aprovacao.getFullYear() + 1));
                        }
                    }
                    if (obj.certificado.includes('Bird ID')) {
                        if (obj.validade) {
                            Dados.vctoCD = new Date(obj.validade);
                        }
                        else {
                            const aprovacao = new Date(obj.dataAprovacao);
                            Dados.vctoCD = new Date(aprovacao.setFullYear(aprovacao.getFullYear() + 5));
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
                    const update = await ClientUpdate(client[0].id, Dados);
                    if (update.id == 29155) {
                        console.log('🚀 ~ .on ~ update:', update);
                    }
                    if (update)
                        retono++;
                }
                else {
                    let Dados = {};
                    const referencia = obj.referenciaExt.split(':')[1];
                    console.log(obj.id);
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
                    if (update.id == 29155) {
                        console.log('🚀 ~ .on ~ update:', update);
                    }
                    if (update)
                        retono++;
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
async function verifiqueVoucher(voucher) {
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
    }
    catch (error) {
        throw error;
    }
}
async function ClientUpdate(id, data) {
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
    }
    catch (error) {
        throw error;
    }
}
function deletarArquivosAntigos(diretorio) {
    fs_1.default.readdir(diretorio, (err, arquivos) => {
        if (err) {
            console.error('Erro ao ler diretório:', err);
            return;
        }
        for (let i = 0; i < arquivos.length; i++) {
            const arquivo = arquivos[i];
            const caminhoCompleto = path_1.default.join(diretorio, arquivo);
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
                    fs_1.default.unlink(caminhoCompleto, (err) => {
                        if (err) {
                            console.error('Erro ao excluir o arquivo:', caminhoCompleto, err);
                        }
                        else {
                            console.log('Arquivo excluído:', caminhoCompleto);
                        }
                    });
                }
                else {
                    console.log('Arquivo recente encontrado:', arquivo);
                    // Aqui você pode adicionar a lógica para manter o arquivo
                }
            }
        }
    });
}
