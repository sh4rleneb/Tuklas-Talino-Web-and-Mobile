import fs from 'fs';
import path from 'path';

const serverPath = path.resolve('backend/src/server.js');
const routesIndexPath = path.resolve('backend/src/routes/index.js');
const validatorPath = path.resolve('backend/src/validators/lesson.validator.js');

/**
 * 1. Ensure validator exists (idempotent safety check)
 */
function ensureValidator() {
  if (fs.existsSync(validatorPath)) {
    console.log('✔ Validator already exists');
    return;
  }

  fs.mkdirSync(path.dirname(validatorPath), { recursive: true });

  fs.writeFileSync(
    validatorPath,
    `
export function validateLesson(passage = '') {
  const text = String(passage || '');

  const hasLayunin = /Layunin\\s*:/.test(text);
  const hasAralin = /Aralin\\s*:/.test(text);
  const hasGawain = /Gawain\\s*:/.test(text);

  const hasBadMarkers =
    text.includes('TUKLAS TALINO SAMPLE LESSON PLAN') ||
    text.includes('Subject:') ||
    text.includes('Module:');

  return {
    isValid: hasLayunin && hasAralin && hasGawain && !hasBadMarkers,
    errors: {
      missingLayunin: !hasLayunin,
      missingAralin: !hasAralin,
      missingGawain: !hasGawain,
      containsLegacyFormat: hasBadMarkers,
    }
  };
}
`.trim()
  );

  console.log('✔ Validator created');
}

/**
 * 2. Inject middleware into routes/index.js safely
 */
function patchRoutes() {
  let code = fs.readFileSync(routesIndexPath, 'utf8');

  if (!code.includes('validateLesson')) {
    code =
      `import { validateLesson } from '../validators/lesson.validator.js';\n` +
      code;
  }

  if (!code.includes('lessonGuard')) {
    const middleware = `
function lessonGuard(req, res, next) {
  const url = req.originalUrl || '';

  if (!url.includes('/lessons')) return next();

  const text = req.body?.passage || '';
  const check = validateLesson(text);

  if (!check.isValid) {
    return res.status(400).json({
      message: 'Lesson blocked by schema lock',
      errors: check.errors
    });
  }

  next();
}
`;

    code = code.replace(
      /const router = express\.Router\(\);/,
      `const router = express.Router();\n${middleware}\nrouter.use(lessonGuard);`
    );
  }

  fs.writeFileSync(routesIndexPath, code);
  console.log('✔ Routes patched');
}

/**
 * 3. Ensure server.js does NOT need modification (noop-safe)
 */
function patchServer() {
  let code = fs.readFileSync(serverPath, 'utf8');

  if (!code.includes('lessonSchemaLockApplied')) {
    code += `\n// lessonSchemaLockApplied=true\n`;
    fs.writeFileSync(serverPath, code);
    console.log('✔ Server marked (no functional change)');
  } else {
    console.log('✔ Server already marked');
  }
}

function main() {
  ensureValidator();
  patchRoutes();
  patchServer();
  console.log('\n🎯 SCHEMA LOCK APPLIED SUCCESSFULLY');
}

main();
