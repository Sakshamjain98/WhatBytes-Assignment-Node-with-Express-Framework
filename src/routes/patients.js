const router = require('express').Router();
const { Patient } = require('../db');
const v = require('../validators');

const update = v.patient.partial().refine((d) => Object.keys(d).length, 'Provide at least one field');

// Patients are private to the user who created them.
const findOwn = (req) => Patient.findOne({ where: { id: v.id.parse(req.params.id), createdBy: req.userId } });
const notFound = (res) => res.status(404).json({ error: 'Patient not found' });

router.post('/', async (req, res) => {
  const patient = await Patient.create({ ...v.patient.parse(req.body), createdBy: req.userId });
  res.status(201).json(patient);
});

router.get('/', async (req, res) => {
  res.json(await Patient.findAll({ where: { createdBy: req.userId }, order: [['id', 'ASC']] }));
});

router.get('/:id', async (req, res) => {
  const patient = await findOwn(req);
  patient ? res.json(patient) : notFound(res);
});

router.put('/:id', async (req, res) => {
  const data = update.parse(req.body);
  const patient = await findOwn(req);
  if (!patient) return notFound(res);
  res.json(await patient.update(data));
});

router.delete('/:id', async (req, res) => {
  const patient = await findOwn(req);
  if (!patient) return notFound(res);
  await patient.destroy();
  res.status(204).end();
});

module.exports = router;
