const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do storage do multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/images');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // O nome do arquivo será definido no controller após obter o ID do produto
    cb(null, file.originalname);
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;

