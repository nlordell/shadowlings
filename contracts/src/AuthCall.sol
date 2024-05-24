// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

/**
 * @title Auth Call - Allows to do AuthCall based transactions.
 */
contract AuthCall {
    bytes32 public constant COMMIT = keccak256("AuthCall");

    /**
     * @dev Using the same name as `multiSend` to keep compatibility with the Safe UI.
     */
    function multiSend(bytes calldata transactions) external payable {
        address authorizer = address(bytes20(transactions[0x01:]));
        uint256 signatureLength = uint256(bytes32(transactions[0x35:]));
        bytes calldata signature = transactions[0x55:0x55 + signatureLength];
        bytes calldata onlyTransactions = transactions[0x55 + signatureLength:];
        multiAuthCall(authorizer, signature, onlyTransactions);
    }

    /**
     * @param authorizer The authorizer
     * @param signature The signature from the authorizer
     * @param transactions Encoded transactions. Each transaction is encoded as a packed bytes of
     *                     operation has to be uint8(2) in this version (=> 1 byte),
     *                     to as a address (=> 20 bytes),
     *                     value as a uint256 (=> 32 bytes),
     *                     data length as a uint256 (=> 32 bytes),
     *                     data as bytes.
     *                     see abi.encodePacked for more information on packed encoding
     * @notice The code is for most part the same as the normal MultiSend (to keep compatibility),
     *         but reverts if a transaction tries to use a call/delegatecall.
     */
    function multiAuthCall(address authorizer, bytes calldata signature, bytes memory transactions) public payable {
        {
            bool success;
            bytes memory authData = abi.encodePacked(signature, COMMIT);
            // solhint-disable-next-line no-inline-assembly
            assembly {
                // auth requires three parameters, the authorizer, the authData offset, and the authData length
                success := auth(authorizer, add(authData, 0x20), mload(authData))
            }
            require(success, "AuthCall: Auth failed");
        }

        // solhint-disable-next-line no-inline-assembly
        assembly {
            let length := mload(transactions)
            let i := 0x20
            for {
                // Pre block is not used in "while mode"
            } lt(i, length) {
                // Post block is not used in "while mode"
            } {
                // First byte of the data is the operation.
                // We shift by 248 bits (256 - 8 [operation byte]) it right since mload will always load 32 bytes (a word).
                // This will also zero out unused data.
                let operation := shr(0xf8, mload(add(transactions, i)))
                // We offset the load address by 1 byte (operation byte)
                // We shift it right by 96 bits (256 - 160 [20 address bytes]) to right-align the data and zero out unused data.
                let to := shr(0x60, mload(add(transactions, add(i, 0x01))))
                // We offset the load address by 21 byte (operation byte + 20 address bytes)
                let value := mload(add(transactions, add(i, 0x15)))
                // We offset the load address by 53 byte (operation byte + 20 address bytes + 32 value bytes)
                let dataLength := mload(add(transactions, add(i, 0x35)))
                // We offset the load address by 85 byte (operation byte + 20 address bytes + 32 value bytes + 32 data length bytes)
                let data := add(transactions, add(i, 0x55))
                let success := 0
                switch operation
                // This version only allow regular calls
                case 0 { success := authcall(gas(), to, value, data, dataLength, 0, 0) }
                // This version does not allow delegatecalls
                case 1 { revert(0, 0) }
                // This version only allows AuthCalls
                case 2 { success := authcall(gas(), to, value, data, dataLength, 0, 0) }
                if eq(success, 0) { revert(0, 0) }
                // Next entry starts at 85 byte + data length
                i := add(i, add(0x55, dataLength))
            }
        }
    }
}
