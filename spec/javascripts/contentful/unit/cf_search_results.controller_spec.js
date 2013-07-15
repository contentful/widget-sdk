// It should adjust selectedIndex, numResults
// it should correctly adjust these if result is null
//
// it should watch searchResults param
// it should watch searchTerm param
//
// cancelSearch should set searchTerm to ''
//
// getSelected should return the selected element from the searchResults
// selectNext should never extend past upepr border
// selectNext should broadcast with selectedresult and selectedindex
// same for selectPrevious
//
// pickSelected should emit result
// when not prevent should cancelSearch
