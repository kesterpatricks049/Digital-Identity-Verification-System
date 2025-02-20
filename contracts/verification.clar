;; Verification Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))

;; Data Maps
(define-map verifications
  { verification-id: uint }
  {
    verifier: principal,
    credential-id: uint,
    status: (string-ascii 20),
    verified-at: uint
  }
)

(define-map verifiers
  { verifier: principal }
  { authorized: bool }
)

(define-data-var verification-nonce uint u0)

;; Public Functions
(define-public (authorize-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err ERR_NOT_AUTHORIZED))
    (ok (map-set verifiers { verifier: verifier } { authorized: true }))
  )
)

(define-public (revoke-verifier-authorization (verifier principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err ERR_NOT_AUTHORIZED))
    (ok (map-set verifiers { verifier: verifier } { authorized: false }))
  )
)

(define-public (verify-credential (credential-id uint) (status (string-ascii 20)))
  (let
    ((new-id (+ (var-get verification-nonce) u1)))
    (asserts! (is-authorized-verifier tx-sender) (err ERR_NOT_AUTHORIZED))
    (var-set verification-nonce new-id)
    (ok (map-set verifications
      { verification-id: new-id }
      {
        verifier: tx-sender,
        credential-id: credential-id,
        status: status,
        verified-at: block-height
      }
    ))
  )
)

;; Read-only Functions
(define-read-only (get-verification (verification-id uint))
  (map-get? verifications { verification-id: verification-id })
)

(define-read-only (is-authorized-verifier (verifier principal))
  (default-to false (get authorized (map-get? verifiers { verifier: verifier })))
)

(define-read-only (get-latest-verification (credential-id uint))
  (var-get verification-nonce)
)

