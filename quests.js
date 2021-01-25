import { createNewRule, filterByColor } from './functions.js'
import { colors, symbols } from './constants.js'

export function createQuests() {
    return [
        [
            createNewRule("De trois quart", "+4 for 3 and 4", (playerCards) =>
                playerCards.map(
                    (c) =>
                        (c.folds || []).flat().filter(
                            (card) =>
                                card.symbol === symbols.THREE || card.symbol === symbols.FOUR
                        ).length * 4
                )
            ),
            createNewRule("De six à sept quart", "+4 for 6 and 7", (playerCards) =>
                playerCards.map(
                    (c) =>
                        (c.folds || []).flat().filter(
                            (card) =>
                                card.symbol === symbols.SIX || card.symbol === symbols.SEVEN
                        ).length * 4
                )
            )
        ],
        [
            createNewRule(
                "Dernier carré",
                "+4 pour exactement 4 plis",
                (playerCards) =>
                    playerCards.map((c) => c.folds && c.folds.length === 4 ? 4 : 0)
            ),
            createNewRule(
                "Demi carré",
                "+4 pour exactement 2 plis",
                (playerCards) =>
                    playerCards.map((c) => c.folds && c.folds.length === 2 ? 4 : 0)
            )
        ],
        [
            createNewRule(
                'Victoire des chevaliers sur les nains',
                '+1 par chevalier, -1 par nain',
                (playerCards) =>
                    playerCards.map((c) => {
                        const blueCards = filterByColor(c.folds, colors.BLUE)
                            .length
                        const greenCards = filterByColor(c.folds, colors.GREEN)
                            .length
                        console.log('player has ', blueCards, ' blue cards')
                        console.log('player has ', greenCards, ' green cards')
                        return blueCards - greenCards
                    })
            ),
            createNewRule(
                'Victoire des nains sur les chevaliers',
                '+1 par nain, -1 par chevalier',
                (playerCards) =>
                    playerCards.map((c) => {
                        const blueCards = filterByColor(c.folds, colors.BLUE)
                            .length
                        const greenCards = filterByColor(c.folds, colors.GREEN)
                            .length
                        console.log('player has ', blueCards, ' blue cards')
                        console.log('player has ', greenCards, ' green cards')
                        return greenCards - blueCards
                    })
            ),
        ],
        // [
        //     createNewRule(
        //         "Armée d'élite",
        //         "Autant de point que le nombre de carte dans la couleur où vous en avez le moins",
        //         (playerCards) => playerCards.map(
        //             (c) => {
        //                 const cardsPerColors = (c.folds || []).flat()
        //                     // tri par couleur
        //                     .sort((c1, c2) => c1.color.localeCompare(c2.color))
        //                     // découpage avec un tableau par couleur
        //                     .reduce((output, card) => {
        //                         if (output.length === 0) output.push([card]);
        //                         else if (output[output.length - 1][0].color === card.color) output[output.length - 1].push(card);
        //                         else output.push([card]);
        //                         return output;
        //                     }, [])
        //
        //                 console.log('cardsPerColors', cardsPerColors);
        //
        //                 return Math.min(cardsPerColors.map(cards => cards.length))
        //             }
        //         )
        //     ),
        //     createNewRule(
        //         "Armée de masse",
        //         "Autant de point que le nombre de carte dans la couleur où vous en avez le plus",
        //         (playerCards) => playerCards.map(
        //             (c) => {
        //                 const cardsPerColors = (c.folds || []).flat()
        //                     // tri par couleur
        //                     .sort((c1, c2) => c1.color.localeCompare(c2.color))
        //                     // découpage avec un tableau par couleur
        //                     .reduce((output, card) => {
        //                         if (output.length === 0) output.push([card]);
        //                         else if (output[output.length - 1][0].color === card.color) output[output.length - 1].push(card);
        //                         else output.push([card]);
        //                         return output;
        //                     }, [])
        //
        //                 console.log('cardsPerColors', cardsPerColors);
        //
        //                 return Math.max(cardsPerColors.map(cards => cards.length))
        //             }
        //         )
        //     )
        // ]
    ]
}
