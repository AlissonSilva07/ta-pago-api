import fastifyMulter from 'fastify-multer'

const storage = fastifyMulter.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Store uploaded files in 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
})

export const upload = fastifyMulter({ storage })
