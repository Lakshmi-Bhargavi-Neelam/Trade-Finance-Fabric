const axios = require("axios");
const FormData = require("form-data");
const config = require("../config");

async function uploadFile(buffer, fileName) {

  const form = new FormData();

  form.append(
    "file",
    buffer,
    {
      filename: fileName
    }
  );

  const response = await axios.post(
    `${config.ipfs.apiUrl}/api/v0/add`,
    form,
    {
      headers: form.getHeaders(),
      params: {
        pin: true
      }
    }
  );

  return response.data.Hash;
}


async function downloadFile(cid) {

  const response = await axios.post(
    `${config.ipfs.apiUrl}/api/v0/cat`,
    null,
    {
      params: {
        arg: cid
      },
      responseType: "arraybuffer"
    }
  );

  return Buffer.from(response.data);
}


async function checkHealth() {

  try {

    const response = await axios.post(
      `${config.ipfs.apiUrl}/api/v0/version`
    );

    return {
      ok: true,
      version: response.data.Version
    };

  } catch (err) {

    return {
      ok: false,
      error: err.message
    };

  }
}


module.exports = {
  uploadFile,
  downloadFile,
  checkHealth
};