// SPDX-License-Identifier: MIT
// ⚠️ DEPRECATED — use PixelRaidCardsV2.sol instead
// This contract is orphaned (deployed at 0xB96e…3AC) and no longer used by the game UI.
// See docs/v2-design.md for migration rationale.
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PixelRaidCards
 * @dev ERC-721 NFT contract for Pixel Raid game cards
 * Each card is a unique NFT with on-chain metadata
 */
contract PixelRaidCards is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Card metadata struct
    struct CardData {
        string name;
        string className;     // warrior, mage, archer, healer, assassin
        string rarity;        // common, rare, epic, legendary, mythic
        uint256 hp;
        uint256 atk;
        uint256 def;
        uint256 spd;
        uint256 crit;
        uint256 artSeed;
    }

    mapping(uint256 => CardData) public cards;

    constructor() ERC721("PixelRaidCards", "PRC") {
        _tokenIdCounter.increment();
    }

    function mintCard(
        address to,
        string memory name,
        string memory className,
        string memory rarity,
        uint256 hp,
        uint256 atk,
        uint256 def,
        uint256 spd,
        uint256 crit,
        uint256 artSeed
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);

        cards[tokenId] = CardData({
            name: name,
            className: className,
            rarity: rarity,
            hp: hp,
            atk: atk,
            def: def,
            spd: spd,
            crit: crit,
            artSeed: artSeed
        });

        return tokenId;
    }

    // Required overrides
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
