;; Identity Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_ALREADY_EXISTS (err u409))

;; Data Maps
(define-map identities
  { id: principal }
  {
    name: (string-ascii 64),
    date-of-birth: uint,
    country: (string-ascii 64),
    created-at: uint,
    updated-at: uint
  }
)

;; Public Functions
(define-public (create-identity (name (string-ascii 64)) (date-of-birth uint) (country (string-ascii 64)))
  (let
    ((identity-data {
      name: name,
      date-of-birth: date-of-birth,
      country: country,
      created-at: block-height,
      updated-at: block-height
    }))
    (match (map-get? identities { id: tx-sender })
      existing-identity (err ERR_ALREADY_EXISTS)
      (ok (map-set identities { id: tx-sender } identity-data))
    )
  )
)

(define-public (update-identity (name (string-ascii 64)) (date-of-birth uint) (country (string-ascii 64)))
  (let
    ((identity (unwrap! (map-get? identities { id: tx-sender }) (err ERR_NOT_FOUND))))
    (ok (map-set identities
      { id: tx-sender }
      (merge identity {
        name: name,
        date-of-birth: date-of-birth,
        country: country,
        updated-at: block-height
      })
    ))
  )
)

(define-public (delete-identity)
  (begin
    (asserts! (is-some (map-get? identities { id: tx-sender })) (err ERR_NOT_FOUND))
    (ok (map-delete identities { id: tx-sender }))
  )
)

;; Read-only Functions
(define-read-only (get-identity (id principal))
  (map-get? identities { id: id })
)

(define-read-only (identity-exists (id principal))
  (is-some (map-get? identities { id: id }))
)
