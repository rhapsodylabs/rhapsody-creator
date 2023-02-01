// SPDX-License-Identifier: CC-BY-NC-SA-4.0
pragma solidity ^0.8.0;

import "../ElevateCreatorBasic.sol";

contract ElevateCreatorTest is ElevateCreatorBasic {
    constructor(
        uint256 _collectionSize,
        uint256 _maxPublicBatchPerAddress,
        uint256 _amountForPromotion,
        uint256 _mintPrice
    )
        ElevateCreatorBasic(
            "Elevate Creator Test",
            "EA",
            _collectionSize,
            _maxPublicBatchPerAddress,
            _amountForPromotion,
            _mintPrice,
            0,
            1,
            2
        )
    {}

    function _currentTime() internal view override returns (uint256) {
        return 123456789;
    }
}