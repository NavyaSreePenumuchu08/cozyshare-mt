const express = require('express')
const multer = require('multer')
const OpenAI = require('openai')
const router = express.Router()

const storage = multer.memoryStorage()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new Error('Only image files are allowed.'))
    }

    callback(null, true)
  },
})

router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No image was uploaded.',
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        message: 'OpenAI API key is not configured.',
      })
    }

    console.log('Analyzing image:', {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    })

    const base64Image = req.file.buffer.toString('base64')

    const imageDataUrl =
      `data:${req.file.mimetype};base64,${base64Image}`

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',

      input: [
        {
          role: 'user',

          content: [
            {
              type: 'input_text',

              text: `
Analyze this household image for the CozyShare task-management system.

Determine whether the image shows a household situation that requires action.

Return only valid JSON in exactly this structure:

{
  "description": "A short factual description of the household situation",
  "detectedObjects": ["object 1", "object 2"],
  "room": "Kitchen, Bathroom, Bedroom, Living room, Garden, Laundry area, or General",
  "suggestedAction": "A short household action",
  "confidence": 0.0,
  "taskNeeded": true
}

Rules:
- Confidence must be between 0 and 1.
- Mention only clearly visible objects.
- Do not assume that clean objects are dirty.
- Set taskNeeded to false when no clear household task is visible.
- Do not include Markdown or text outside the JSON.
              `.trim(),
            },

            {
              type: 'input_image',
              image_url: imageDataUrl,
              detail: 'low',
            },
          ],
        },
      ],
    })

    const outputText = response.output_text?.trim()

    if (!outputText) {
      return res.status(502).json({
        message: 'The vision model returned an empty response.',
      })
    }

    let analysis

    try {
      const cleanedOutput = outputText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      analysis = JSON.parse(cleanedOutput)
    } catch (parseError) {
      console.error('Vision JSON parsing failed:', outputText)

      return res.status(502).json({
        message: 'The vision response could not be processed.',
        rawResponse: outputText,
      })
    }

    const confidence = Number(analysis.confidence)

    const normalizedAnalysis = {
      description:
        analysis.description ||
        'No clear household situation was detected.',

      detectedObjects: Array.isArray(analysis.detectedObjects)
        ? analysis.detectedObjects
        : [],

      room: analysis.room || 'General',

      suggestedAction: analysis.suggestedAction || '',

      confidence: Number.isFinite(confidence)
        ? Math.min(1, Math.max(0, confidence))
        : 0,

      taskNeeded: Boolean(analysis.taskNeeded),
    }

    return res.status(200).json({
      message: 'Image analyzed successfully.',
      analysis: normalizedAnalysis,
    })
  } catch (error) {
    console.error(
      'Vision analysis error:',
      error.status,
      error.message,
    )

    if (error.status === 401) {
      return res.status(401).json({
        message: 'The OpenAI API key is invalid.',
      })
    }

    if (error.status === 429) {
      return res.status(429).json({
        message:
          'The AI service usage limit was reached. Check the API account billing or try again later.',
      })
    }

    return res.status(500).json({
      message: 'Could not analyze the uploaded image.',
      error: error.message,
    })
  }
})

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Image must be smaller than 8 MB.'
          : error.message,
    })
  }

  if (error) {
    return res.status(400).json({
      message: error.message,
    })
  }

  next()
})

module.exports = router
