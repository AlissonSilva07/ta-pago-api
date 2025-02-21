import fastifyMulter from 'fastify-multer'

const storage = fastifyMulter.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
})

export const upload = fastifyMulter({ storage, limits: { fileSize: 10 * 1024 * 1024 } })
