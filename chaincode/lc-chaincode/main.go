// Entry point for the Letter of Credit chaincode.
package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func main() {
	chaincode, err := contractapi.NewChaincode(&LCContract{})
	if err != nil {
		log.Panicf("Error creating lc-chaincode: %v", err)
	}

	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting lc-chaincode: %v", err)
	}
}
