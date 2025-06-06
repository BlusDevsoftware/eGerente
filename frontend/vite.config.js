import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        login: resolve(__dirname, 'src/login.html'),
        usuarios: resolve(__dirname, 'src/usuarios.html'),
        colaboradores: resolve(__dirname, 'src/colaboradores.html'),
        clientes: resolve(__dirname, 'src/clientes.html'),
        produtos: resolve(__dirname, 'src/produtos.html'),
        servicos: resolve(__dirname, 'src/servicos.html'),
        comissoes: resolve(__dirname, 'src/comissoes.html'),
        lancarComissao: resolve(__dirname, 'src/lancar-comissao.html'),
        movimentoComissao: resolve(__dirname, 'src/movimento-comissao.html'),
        consultaComissao: resolve(__dirname, 'src/consulta-comissao.html'),
        recebimento: resolve(__dirname, 'src/recebimento.html'),
        conferencia: resolve(__dirname, 'src/conferencia.html'),
        dinamico: resolve(__dirname, 'src/dinamico.html'),
        manutencaoBd: resolve(__dirname, 'src/manutencao-bd.html'),
        sincronizar: resolve(__dirname, 'src/sincronizar.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  css: {
    devSourcemap: true
  }
}); 