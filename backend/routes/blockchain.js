// backend/routes/blockchain.js
// REST API routes for Blockchain operations (Polygon Amoy Testnet & Cryptographic Ledger)
import express from 'express';
import {
  createBatchRecord,
  transferBatchOwnership,
  updateBatchStage,
  addQualityCertificate,
  getBatchDetails,
  verifyBatch,
  getBatchHistory,
  getBlockchainStatus
} from '../services/blockchain.js';

export const blockchainRouter = express.Router();

/**
 * GET /api/blockchain/status
 * Get status of connection to Polygon Amoy
 */
blockchainRouter.get('/status', (req, res) => {
  res.json({
    success: true,
    ...getBlockchainStatus(),
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/blockchain/batch
 * Record produce batch on-chain (Farmer)
 */
blockchainRouter.post('/batch', async (req, res) => {
  try {
    const { batchId, cropName, quantity, dataHash, price, ownerAddress } = req.body;
    if (!batchId || !cropName) {
      return res.status(400).json({ error: 'batchId and cropName are required' });
    }

    const result = await createBatchRecord({
      batchId,
      cropName,
      quantity: quantity || 100,
      dataHash,
      price: price || 0,
      ownerAddress
    });

    // Notify connected clients via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.emit('blockchain:batchCreated', result);
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error in POST /api/blockchain/batch:', error);
    res.status(500).json({ error: error.message || 'Failed to record batch on blockchain' });
  }
});

/**
 * POST /api/blockchain/transfer
 * Transfer batch ownership
 */
blockchainRouter.post('/transfer', async (req, res) => {
  try {
    const { batchId, newOwnerAddress } = req.body;
    if (!batchId || !newOwnerAddress) {
      return res.status(400).json({ error: 'batchId and newOwnerAddress are required' });
    }

    const result = await transferBatchOwnership({ batchId, newOwnerAddress });

    const io = req.app.get('io');
    if (io) {
      io.emit('blockchain:ownershipTransferred', result);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in POST /api/blockchain/transfer:', error);
    res.status(500).json({ error: error.message || 'Failed to transfer batch ownership' });
  }
});

/**
 * POST /api/blockchain/stage
 * Transition produce stage + price update
 */
blockchainRouter.post('/stage', async (req, res) => {
  try {
    const { batchId, stage, location, price, updatedBy } = req.body;
    if (!batchId || stage === undefined) {
      return res.status(400).json({ error: 'batchId and stage are required' });
    }

    const result = await updateBatchStage({ batchId, stage, location, price, updatedBy });

    const io = req.app.get('io');
    if (io) {
      io.emit('blockchain:stageUpdated', result);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in POST /api/blockchain/stage:', error);
    res.status(500).json({ error: error.message || 'Failed to update batch stage' });
  }
});

/**
 * POST /api/blockchain/certificate
 * Add quality lab certificate hash
 */
blockchainRouter.post('/certificate', async (req, res) => {
  try {
    const { batchId, certificateId, grade, certHash, inspectorAddress } = req.body;
    if (!batchId || !certificateId || !grade) {
      return res.status(400).json({ error: 'batchId, certificateId, and grade are required' });
    }

    const result = await addQualityCertificate({
      batchId,
      certificateId,
      grade,
      certHash,
      inspectorAddress
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('blockchain:certificateAdded', result);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in POST /api/blockchain/certificate:', error);
    res.status(500).json({ error: error.message || 'Failed to add certificate' });
  }
});

/**
 * GET /api/blockchain/batch/:batchId
 * Read batch data
 */
blockchainRouter.get('/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const details = await getBatchDetails(batchId);
    if (!details) {
      return res.status(404).json({ error: `Batch ${batchId} not found` });
    }
    res.json({ success: true, data: details });
  } catch (error) {
    console.error(`Error in GET /api/blockchain/batch/${req.params.batchId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/blockchain/verify/:batchId
 * Public verification endpoint for consumer QR scanning
 */
blockchainRouter.get('/verify/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { hash } = req.query;
    const verification = await verifyBatch(batchId, hash);
    res.json({ success: true, data: verification });
  } catch (error) {
    console.error(`Error in GET /api/blockchain/verify/${req.params.batchId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/blockchain/history/:batchId
 * Get complete stage & price history
 */
blockchainRouter.get('/history/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const history = await getBatchHistory(batchId);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error(`Error in GET /api/blockchain/history/${req.params.batchId}:`, error);
    res.status(500).json({ error: error.message });
  }
});
