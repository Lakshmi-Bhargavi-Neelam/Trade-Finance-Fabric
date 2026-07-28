// Package main implements the Letter of Credit (LC) chaincode.
//
// This is an educational / MVP smart contract. It is intentionally kept
// simple: no access-control lists, no fine-grained MSP checks beyond what
// Fabric's channel/endorsement policy already enforces, and a flat data
// model. See README.md in this repo for the full project scope.
package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ---------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------

// LC status values. The workflow is linear:
// CREATED -> DOCUMENTS_UPLOADED -> (CUSTOMS_APPROVED + BANK_APPROVED) -> PAYMENT_RELEASED
const (
	StatusCreated           = "CREATED"
	StatusDocumentsUploaded = "DOCUMENTS_UPLOADED"
	StatusCustomsApproved   = "CUSTOMS_APPROVED"
	StatusBankApproved      = "BANK_APPROVED"
	StatusPaymentReleased   = "PAYMENT_RELEASED"
)

// Document type constants used when uploading document metadata.
const (
	DocTypeInvoice      = "INVOICE"
	DocTypeBillOfLading = "BILL_OF_LADING"
)

// DocumentMetadata represents a pointer to a file stored in IPFS.
// The chaincode NEVER stores file contents, only the metadata needed
// to prove integrity and locate the file.
type DocumentMetadata struct {
	CID        string `json:"cid"` // IPFS content identifier
	FileName   string `json:"fileName"`
	FileHash   string `json:"fileHash"` // sha256 hash of the original file, for extra integrity checking
	DocType    string `json:"docType"`  // INVOICE | BILL_OF_LADING
	UploadedBy string `json:"uploadedBy"`
	UploadedAt string `json:"uploadedAt"` // RFC3339 timestamp
}

// LetterOfCredit is the core asset stored on the ledger.
type LetterOfCredit struct {
	DocType string `json:"docType"` // constant "LC", helps CouchDB rich queries distinguish asset types

	LCID         string  `json:"lcId"`
	Importer     string  `json:"importer"`
	Exporter     string  `json:"exporter"`
	ImporterBank string  `json:"importerBank"`
	ExporterBank string  `json:"exporterBank"`
	Commodity string `json:"commodity"`
    Quantity  string `json:"quantity"`
	Amount       float64 `json:"amount"`
	Currency     string  `json:"currency"`
	ExpiryDate string `json:"expiryDate"`

	Status string `json:"status"`

	InvoiceDocument      *DocumentMetadata `json:"invoiceDocument"`
	BillOfLadingDocument *DocumentMetadata `json:"billOfLadingDocument"`

	CustomsApproved   bool   `json:"customsApproved"`
	CustomsApprovedBy string `json:"customsApprovedBy"`
	CustomsApprovedAt string `json:"customsApprovedAt"`

	BankApproved   bool   `json:"bankApproved"`
	BankApprovedBy string `json:"bankApprovedBy"`
	BankApprovedAt string `json:"bankApprovedAt"`

	PaymentReleased   bool   `json:"paymentReleased"`
	PaymentReleasedAt string `json:"paymentReleasedAt"`

	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// HistoryEntry represents one entry in an asset's change history,
// as returned by GetLCHistory.
type HistoryEntry struct {
	TxID      string          `json:"txId"`
	Timestamp string          `json:"timestamp"`
	IsDelete  bool            `json:"isDelete"`
	LC        *LetterOfCredit `json:"lc,omitempty"`
}

// ---------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------

// LCContract implements the trade-finance smart contract.
type LCContract struct {
	contractapi.Contract
}

const lcKeyPrefix = "LC_"

func lcKey(lcID string) string {
	return lcKeyPrefix + lcID
}

// ---------------------------------------------------------------------
// CreateLC
// ---------------------------------------------------------------------

// CreateLC is invoked by a Bank Officer to open a new Letter of Credit.
// It fails if an LC with the same ID already exists.
func (c *LCContract) CreateLC(
	ctx contractapi.TransactionContextInterface,
	lcID string,
	importer string,
	exporter string,
	importerBank string,
	exporterBank string,
	commodity string,
    quantity string,
	amount float64,
	currency string,
    expiryDate string,
) error {
	if lcID == "" {
		return fmt.Errorf("lcId is required")
	}
	if amount <= 0 {
		return fmt.Errorf("amount must be greater than zero")
	}
	if commodity == "" {
    return fmt.Errorf("commodity is required")
   }

   if quantity == "" {
    return fmt.Errorf("quantity is required")
   }

   if expiryDate == "" {
    return fmt.Errorf("expiryDate is required")
 }

	existing, err := ctx.GetStub().GetState(lcKey(lcID))
	if err != nil {
		return fmt.Errorf("failed to read world state: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("a letter of credit with ID %s already exists", lcID)
	}

	timestamp, err := txTimestamp(ctx)
	if err != nil {
		return err
	}

	lc := LetterOfCredit{
    DocType:      "LC",
    LCID:         lcID,
    Importer:     importer,
    Exporter:     exporter,
    ImporterBank: importerBank,
    ExporterBank: exporterBank,
    Commodity: commodity,
    Quantity: quantity,

    Amount: amount,
    Currency: currency,

    ExpiryDate: expiryDate,

    Status: StatusCreated,

    InvoiceDocument:      nil,
    BillOfLadingDocument: nil,

    CustomsApproved:   false,
    CustomsApprovedBy: "",
    CustomsApprovedAt: "",

    BankApproved:   false,
    BankApprovedBy: "",
    BankApprovedAt: "",

    PaymentReleased:   false,
    PaymentReleasedAt: "",

    CreatedAt: timestamp,
    UpdatedAt: timestamp,
    }

	return c.putLC(ctx, &lc)
}

// ---------------------------------------------------------------------
// GetLC / GetAllLCs
// ---------------------------------------------------------------------

// GetLC returns a single Letter of Credit by ID.
func (c *LCContract) GetLC(ctx contractapi.TransactionContextInterface, lcID string) (*LetterOfCredit, error) {
	return c.readLC(ctx, lcID)
}

// GetAllLCs returns every Letter of Credit currently on the ledger.
// For an MVP this is a simple full-range query; a production system
// would paginate or use a CouchDB rich query with an index instead.
func (c *LCContract) GetAllLCs(ctx contractapi.TransactionContextInterface) ([]*LetterOfCredit, error) {
	iterator, err := ctx.GetStub().GetStateByRange(lcKeyPrefix, lcKeyPrefix+"\uffff")
	if err != nil {
		return nil, fmt.Errorf("failed to get state range: %v", err)
	}
	defer iterator.Close()

	var lcs []*LetterOfCredit
	for iterator.HasNext() {
		queryResult, err := iterator.Next()
		if err != nil {
			return nil, err
		}
		var lc LetterOfCredit
		if err := json.Unmarshal(queryResult.Value, &lc); err != nil {
			return nil, err
		}
		lcs = append(lcs, &lc)
	}

	return lcs, nil
}

// ---------------------------------------------------------------------
// UploadDocument
// ---------------------------------------------------------------------

// UploadDocument records the IPFS CID and hash of a document (invoice or
// bill of lading) against an existing LC. The actual file bytes are
// expected to already be stored in IPFS by the backend before this is
// called; the chaincode only ever sees metadata.
func (c *LCContract) UploadDocument(
	ctx contractapi.TransactionContextInterface,
	lcID string,
	docType string,
	cid string,
	fileName string,
	fileHash string,
	uploadedBy string,
) error {
	if docType != DocTypeInvoice && docType != DocTypeBillOfLading {
		return fmt.Errorf("docType must be %s or %s", DocTypeInvoice, DocTypeBillOfLading)
	}
	if cid == "" {
		return fmt.Errorf("cid is required")
	}

	lc, err := c.readLC(ctx, lcID)
	if err != nil {
		return err
	}

	timestamp, err := txTimestamp(ctx)
	if err != nil {
		return err
	}

	doc := &DocumentMetadata{
		CID:        cid,
		FileName:   fileName,
		FileHash:   fileHash,
		DocType:    docType,
		UploadedBy: uploadedBy,
		UploadedAt: timestamp,
	}

	if docType == DocTypeInvoice {
		lc.InvoiceDocument = doc
	} else {
		lc.BillOfLadingDocument = doc
	}

	// Move status forward once at least one required document is present,
	// but only if the LC hasn't progressed further already.
	if lc.InvoiceDocument != nil &&
   lc.BillOfLadingDocument != nil &&
   lc.Status == StatusCreated {
    lc.Status = StatusDocumentsUploaded
   }
	lc.UpdatedAt = timestamp

	return c.putLC(ctx, lc)
}

// ---------------------------------------------------------------------
// CustomsApproval / BankApproval
// ---------------------------------------------------------------------

// CustomsApproval is invoked by a Customs Officer once the shipment has
// been verified. Both documents must be uploaded first.
func (c *LCContract) CustomsApproval(ctx contractapi.TransactionContextInterface, lcID string, approvedBy string) error {
	lc, err := c.readLC(ctx, lcID)
	if err != nil {
		return err
	}

	if lc.InvoiceDocument == nil || lc.BillOfLadingDocument == nil {
		return fmt.Errorf("cannot approve customs: invoice and bill of lading must be uploaded first")
	}
	if lc.CustomsApproved {
		return fmt.Errorf("customs approval has already been granted for LC %s", lcID)
	}

	timestamp, err := txTimestamp(ctx)
	if err != nil {
		return err
	}

	lc.CustomsApproved = true
	lc.CustomsApprovedBy = approvedBy
	lc.CustomsApprovedAt = timestamp
	if lc.Status == StatusDocumentsUploaded {
		lc.Status = StatusCustomsApproved
	}
	lc.UpdatedAt = timestamp

	c.maybeReleasePayment(lc, timestamp)

	return c.putLC(ctx, lc)
}

// BankApproval is invoked by a Bank Officer once the documents have been
// reviewed and accepted. Both documents must be uploaded first.
func (c *LCContract) BankApproval(ctx contractapi.TransactionContextInterface, lcID string, approvedBy string) error {
	lc, err := c.readLC(ctx, lcID)
	if err != nil {
		return err
	}

	if lc.InvoiceDocument == nil || lc.BillOfLadingDocument == nil {
		return fmt.Errorf("cannot approve: invoice and bill of lading must be uploaded first")
	}
	if lc.BankApproved {
		return fmt.Errorf("bank approval has already been granted for LC %s", lcID)
	}

	timestamp, err := txTimestamp(ctx)
	if err != nil {
		return err
	}

	lc.BankApproved = true
	lc.BankApprovedBy = approvedBy
	lc.BankApprovedAt = timestamp
	if lc.Status == StatusDocumentsUploaded || lc.Status == StatusCustomsApproved {
		lc.Status = StatusBankApproved
	}
	lc.UpdatedAt = timestamp

	c.maybeReleasePayment(lc, timestamp)

	return c.putLC(ctx, lc)
}

// maybeReleasePayment flips the LC to PAYMENT_RELEASED once both the
// customs and bank approvals are in place. This is the "workflow
// automation" step from the spec: no separate transaction is required,
// it happens automatically as part of whichever approval completes last.
func (c *LCContract) maybeReleasePayment(lc *LetterOfCredit, timestamp string) {
	if lc.CustomsApproved && lc.BankApproved && !lc.PaymentReleased {
		lc.PaymentReleased = true
		lc.PaymentReleasedAt = timestamp
		lc.Status = StatusPaymentReleased
	}
}

// ---------------------------------------------------------------------
// History
// ---------------------------------------------------------------------

// GetLCHistory returns the full change history of an LC, oldest first,
// using Fabric's built-in per-key history index.
func (c *LCContract) GetLCHistory(ctx contractapi.TransactionContextInterface, lcID string) ([]*HistoryEntry, error) {
	iterator, err := ctx.GetStub().GetHistoryForKey(lcKey(lcID))
	if err != nil {
		return nil, fmt.Errorf("failed to get history for LC %s: %v", lcID, err)
	}
	defer iterator.Close()

	var history []*HistoryEntry
	for iterator.HasNext() {
		mod, err := iterator.Next()
		if err != nil {
			return nil, err
		}

		entry := &HistoryEntry{
			TxID:      mod.TxId,
			Timestamp: time.Unix(mod.Timestamp.Seconds, int64(mod.Timestamp.Nanos)).UTC().Format(time.RFC3339),
			IsDelete:  mod.IsDelete,
		}

		if !mod.IsDelete && len(mod.Value) > 0 {
			var lc LetterOfCredit
			if err := json.Unmarshal(mod.Value, &lc); err == nil {
				entry.LC = &lc
			}
		}

		history = append(history, entry)
	}

	return history, nil
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

// readLC fetches and unmarshals an LC, returning a clear error if it
// does not exist.
func (c *LCContract) readLC(ctx contractapi.TransactionContextInterface, lcID string) (*LetterOfCredit, error) {
	data, err := ctx.GetStub().GetState(lcKey(lcID))
	if err != nil {
		return nil, fmt.Errorf("failed to read world state: %v", err)
	}
	if data == nil {
		return nil, fmt.Errorf("letter of credit %s does not exist", lcID)
	}

	var lc LetterOfCredit
	if err := json.Unmarshal(data, &lc); err != nil {
		return nil, fmt.Errorf("failed to unmarshal LC %s: %v", lcID, err)
	}
	return &lc, nil
}

// putLC marshals and writes an LC back to the world state.
func (c *LCContract) putLC(ctx contractapi.TransactionContextInterface, lc *LetterOfCredit) error {
	bytes, err := json.Marshal(lc)
	if err != nil {
		return fmt.Errorf("failed to marshal LC %s: %v", lc.LCID, err)
	}
	return ctx.GetStub().PutState(lcKey(lc.LCID), bytes)
}

// txTimestamp returns the transaction's deterministic timestamp
// (from the ordering service), formatted as RFC3339. Chaincode must
// never call time.Now() directly, since that would not be deterministic
// across peers.
func txTimestamp(ctx contractapi.TransactionContextInterface) (string, error) {
	ts, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return "", fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	return time.Unix(ts.Seconds, int64(ts.Nanos)).UTC().Format(time.RFC3339), nil
}

func (c *LCContract) Ping(ctx contractapi.TransactionContextInterface) (string, error) {
	return "pong", nil
}

func (c *LCContract) GetStatus(
	ctx contractapi.TransactionContextInterface,
	lcID string,
) (string, error) {

	lc, err := c.readLC(ctx, lcID)
	if err != nil {
		return "", err
	}

	return lc.Status, nil
}
