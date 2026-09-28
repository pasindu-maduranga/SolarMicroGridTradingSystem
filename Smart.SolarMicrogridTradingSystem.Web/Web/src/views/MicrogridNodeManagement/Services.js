import { CommonGet, CommonPost, CommonPut, CommonDelete } from '../../helpers/HttpClient';
import tokenDecoder from '../../utils/tokenDecoder';

export default {
  getAllNodes,
  getNodeDetailsByID,
  saveNode,
  updateNode,
  deleteNode,
  getAvailableGridOperators,
  assignGridOperator
};

async function getAllNodes() {
  const response = await CommonGet('/api/Node', null);
  return response.data;
}

async function getNodeDetailsByID(nodeID) {
  const response = await CommonGet('/api/Node/' + nodeID, null);
  return response.data;
}

async function getAvailableGridOperators(excludeNodeId) {
  const query = excludeNodeId ? 'excludeNodeId=' + excludeNodeId : null;
  const response = await CommonGet('/api/Node/available-grid-operators', query);
  return response.data;
}

async function saveNode(node) {
  let saveModel = {
    name: node.name,
    address: node.address,
    latitude: node.latitude,
    longitude: node.longitude,
    capacity: node.capacity,
    numberOfSlots: node.numberOfSlots,
    isActive: node.isActive,
    createdBy: tokenDecoder.getUserIDFromToken()
  };

  const response = await CommonPost('/api/Node', null, saveModel);
  return response;
}

async function updateNode(node) {
  let updateModel = {
    name: node.name,
    address: node.address,
    latitude: node.latitude,
    longitude: node.longitude,
    capacity: node.capacity,
    numberOfSlots: node.numberOfSlots,
    isActive: node.isActive,
    modifiedBy: tokenDecoder.getUserIDFromToken()
  };

  const response = await CommonPut('/api/Node/' + node.nodeID, null, updateModel);
  return response;
}

async function deleteNode(nodeID) {
  const response = await CommonDelete('/api/Node/' + nodeID);
  return response;
}

async function assignGridOperator(nodeID, assignedGridOperatorUserId) {
  const response = await CommonPut('/api/Node/' + nodeID + '/assign-operator', null, { assignedGridOperatorUserId });
  return response;
}
