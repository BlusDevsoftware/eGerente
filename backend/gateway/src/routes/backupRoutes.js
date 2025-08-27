const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rota para fazer backup completo
router.post('/backup', async (req, res) => {
    try {
        console.log('Iniciando backup do banco de dados...');
        
        // Obter todas as tabelas
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
            
        if (tablesError) {
            throw new Error('Erro ao obter tabelas: ' + tablesError.message);
        }

        const backupData = {
            timestamp: new Date().toISOString(),
            tables: {}
        };

        // Fazer backup de cada tabela
        for (const table of tables) {
            const tableName = table.table_name;
            console.log(`Fazendo backup da tabela: ${tableName}`);
            
            const { data: tableData, error: tableError } = await supabase
                .from(tableName)
                .select('*');
                
            if (tableError) {
                console.warn(`Erro ao fazer backup da tabela ${tableName}:`, tableError.message);
                continue;
            }
            
            backupData.tables[tableName] = tableData;
        }

        // Criar diretório de backup se não existir
        const backupDir = path.join(__dirname, '../../backups');
        await fs.mkdir(backupDir, { recursive: true });

        // Salvar backup em arquivo JSON
        const backupFileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const backupFilePath = path.join(backupDir, backupFileName);
        
        await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2));
        
        // Calcular tamanho do arquivo
        const stats = await fs.stat(backupFilePath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`Backup concluído: ${backupFileName} (${fileSizeInMB} MB)`);

        res.json({
            success: true,
            message: 'Backup realizado com sucesso',
            fileName: backupFileName,
            size: `${fileSizeInMB} MB`,
            timestamp: backupData.timestamp,
            tablesCount: Object.keys(backupData.tables).length
        });

    } catch (error) {
        console.error('Erro durante backup:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao realizar backup: ' + error.message
        });
    }
});

// Rota para listar backups existentes
router.get('/backups', async (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../../backups');
        
        // Verificar se o diretório existe
        try {
            await fs.access(backupDir);
        } catch {
            return res.json({ backups: [] });
        }

        const files = await fs.readdir(backupDir);
        const backups = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(backupDir, file);
                const stats = await fs.stat(filePath);
                
                backups.push({
                    fileName: file,
                    size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                });
            }
        }

        // Ordenar por data de criação (mais recente primeiro)
        backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ backups });

    } catch (error) {
        console.error('Erro ao listar backups:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar backups: ' + error.message
        });
    }
});

// Rota para restaurar backup
router.post('/restore/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;
        const backupDir = path.join(__dirname, '../../backups');
        const backupFilePath = path.join(backupDir, fileName);

        // Verificar se o arquivo existe
        try {
            await fs.access(backupFilePath);
        } catch {
            return res.status(404).json({
                success: false,
                message: 'Arquivo de backup não encontrado'
            });
        }

        // Ler arquivo de backup
        const backupContent = await fs.readFile(backupFilePath, 'utf8');
        const backupData = JSON.parse(backupContent);

        console.log(`Iniciando restauração do backup: ${fileName}`);

        // Restaurar cada tabela
        for (const [tableName, tableData] of Object.entries(backupData.tables)) {
            console.log(`Restaurando tabela: ${tableName}`);
            
            // Limpar tabela atual
            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .neq('id', 0); // Deletar todos os registros
                
            if (deleteError) {
                console.warn(`Erro ao limpar tabela ${tableName}:`, deleteError.message);
            }

            // Inserir dados do backup
            if (tableData && tableData.length > 0) {
                const { error: insertError } = await supabase
                    .from(tableName)
                    .insert(tableData);
                    
                if (insertError) {
                    console.warn(`Erro ao restaurar tabela ${tableName}:`, insertError.message);
                }
            }
        }

        console.log(`Restauração concluída: ${fileName}`);

        res.json({
            success: true,
            message: 'Backup restaurado com sucesso',
            fileName: fileName
        });

    } catch (error) {
        console.error('Erro durante restauração:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao restaurar backup: ' + error.message
        });
    }
});

// Rota para deletar backup
router.delete('/backup/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;
        const backupDir = path.join(__dirname, '../../backups');
        const backupFilePath = path.join(backupDir, fileName);

        // Verificar se o arquivo existe
        try {
            await fs.access(backupFilePath);
        } catch {
            return res.status(404).json({
                success: false,
                message: 'Arquivo de backup não encontrado'
            });
        }

        // Deletar arquivo
        await fs.unlink(backupFilePath);

        res.json({
            success: true,
            message: 'Backup deletado com sucesso',
            fileName: fileName
        });

    } catch (error) {
        console.error('Erro ao deletar backup:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar backup: ' + error.message
        });
    }
});

module.exports = router;
