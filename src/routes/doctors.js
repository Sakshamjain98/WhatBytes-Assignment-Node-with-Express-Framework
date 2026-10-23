const router = require('express').Router();
const { Doctor } = require('../db');
const v = require('../validators');

const update = v.doctor.partial().refine((d) => Object.keys(d).length, 'Provide at least one field');

// Doctors are a shared directory: everyone can read, only the creator can modify.
const findEditable = async (req, res) => {
  const doctor = await Doctor.findByPk(v.id.parse(req.params.id));
  if (!doctor) return void res.status(404).json({ error: 'Doctor not found' });
  if (doctor.createdBy !== req.userId) return void res.status(403).json({ error: 'Only the creator can modify this doctor' });
  return doctor;
};

router.post('/', async (req, res) => {
  const doctor = await Doctor.create({ ...v.doctor.parse(req.body), createdBy: req.userId });
  res.status(201).json(doctor);
});

router.get('/', async (req, res) => {
  res.json(await Doctor.findAll({ order: [['id', 'ASC']] }));
});

router.get('/:id', async (req, res) => {
  const doctor = await Doctor.findByPk(v.id.parse(req.params.id));
  doctor ? res.json(doctor) : res.status(404).json({ error: 'Doctor not found' });
});

router.put('/:id', async (req, res) => {
  const data = update.parse(req.body);
  const doctor = await findEditable(req, res);
  if (doctor) res.json(await doctor.update(data));
});

router.delete('/:id', async (req, res) => {
  const doctor = await findEditable(req, res);
  if (!doctor) return;
  await doctor.destroy();
  res.status(204).end();
});

module.exports = router;
