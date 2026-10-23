const router = require('express').Router();
const { Mapping, Patient, Doctor } = require('../db');
const v = require('../validators');

// Mappings are visible only through patients the user owns.
const ownPatient = (req) => ({ model: Patient, where: { createdBy: req.userId }, attributes: ['id', 'name'] });

router.post('/', async (req, res) => {
  const { patientId, doctorId } = v.mapping.parse(req.body);
  const [patient, doctor] = await Promise.all([
    Patient.findOne({ where: { id: patientId, createdBy: req.userId } }),
    Doctor.findByPk(doctorId),
  ]);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  const mapping = await Mapping.create({ patientId, doctorId });
  res.status(201).json(mapping);
});

router.get('/', async (req, res) => {
  res.json(await Mapping.findAll({ include: [ownPatient(req), Doctor], order: [['id', 'ASC']] }));
});

// GET /:patientId lists the doctors for a patient; DELETE /:id takes a mapping id (as per the spec).
router.get('/:patientId', async (req, res) => {
  const patientId = v.id.parse(req.params.patientId);
  const patient = await Patient.findOne({ where: { id: patientId, createdBy: req.userId }, attributes: ['id', 'name'] });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  const mappings = await Mapping.findAll({ where: { patientId }, include: Doctor, order: [['id', 'ASC']] });
  res.json({
    patient,
    doctors: mappings.map((m) => ({ mappingId: m.id, assignedAt: m.createdAt, ...m.Doctor.toJSON() })),
  });
});

router.delete('/:id', async (req, res) => {
  const mapping = await Mapping.findOne({ where: { id: v.id.parse(req.params.id) }, include: ownPatient(req) });
  if (!mapping) return res.status(404).json({ error: 'Mapping not found' });
  await mapping.destroy();
  res.status(204).end();
});

module.exports = router;
